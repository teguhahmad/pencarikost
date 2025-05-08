import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { format } from 'npm:date-fns@3.3.1';
import { SmtpClient } from "npm:smtp@0.1.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active tenants with their rooms and properties
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        email,
        end_date,
        room_id,
        property_id,
        user_id,
        rooms!tenants_room_id_fkey (
          name,
          price
        ),
        properties!tenants_property_id_fkey (
          name,
          owner_id,
          email
        )
      `)
      .eq('status', 'active');

    if (tenantsError) {
      throw new Error(`Failed to fetch tenants: ${tenantsError.message}`);
    }

    if (!tenants || tenants.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0, 
          message: 'No active tenants found to process' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Get user settings for property owners
    const ownerIds = [...new Set(tenants.map(tenant => tenant.properties?.owner_id).filter(Boolean))];
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .in('user_id', ownerIds);

    if (settingsError) {
      throw new Error(`Failed to fetch user settings: ${settingsError.message}`);
    }

    // Create a map of user settings for quick lookup
    const settingsMap = new Map(userSettings?.map(settings => [settings.user_id, settings]));

    // Initialize SMTP client
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: Deno.env.get('SMTP_USERNAME'),
      password: Deno.env.get('SMTP_PASSWORD'),
    });

    const today = new Date();
    const processedTenants = [];
    const errors = [];

    // Process each tenant
    for (const tenant of tenants) {
      try {
        const ownerSettings = settingsMap.get(tenant.properties?.owner_id);
        
        // Skip if missing required data
        if (!ownerSettings || !tenant.end_date || !tenant.rooms?.price) {
          continue;
        }

        const dueDate = new Date(tenant.end_date);
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - ownerSettings.payment_reminder_days);

        // Check if we should create a payment reminder
        if (today >= reminderDate && today < dueDate) {
          // Create payment record
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              tenantId: tenant.id,
              roomId: tenant.room_id,
              property_id: tenant.property_id,
              amount: tenant.rooms.price,
              status: 'pending',
              date: null,
              dueDate: tenant.end_date
            });

          if (paymentError) {
            throw new Error(`Failed to create payment: ${paymentError.message}`);
          }

          // Create notification
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              title: 'Pengingat Pembayaran',
              message: `Pembayaran untuk Kamar ${tenant.rooms.name} akan jatuh tempo pada ${format(dueDate, 'dd MMMM yyyy')}`,
              type: 'payment',
              target_user_id: tenant.user_id,
              status: 'unread'
            });

          if (notificationError) {
            throw new Error(`Failed to create notification: ${notificationError.message}`);
          }

          // Send email to tenant
          if (tenant.email) {
            const emailBody = `
              Yth. ${tenant.name},

              Ini adalah pengingat pembayaran untuk Kamar ${tenant.rooms.name}.
              Pembayaran sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(tenant.rooms.price)}
              akan jatuh tempo pada ${format(dueDate, 'dd MMMM yyyy')}.

              Mohon segera lakukan pembayaran sebelum tanggal jatuh tempo.

              Terima kasih.
              `;

            await client.send({
              from: Deno.env.get('SMTP_USERNAME'),
              to: tenant.email,
              subject: `Pengingat Pembayaran - Kamar ${tenant.rooms.name}`,
              content: emailBody,
            });
          }

          // Send email to property owner
          if (tenant.properties?.email) {
            const ownerEmailBody = `
              Pembayaran untuk Kamar ${tenant.rooms.name} akan jatuh tempo pada ${format(dueDate, 'dd MMMM yyyy')}.
              Penyewa: ${tenant.name}
              Jumlah: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(tenant.rooms.price)}
              `;

            await client.send({
              from: Deno.env.get('SMTP_USERNAME'),
              to: tenant.properties.email,
              subject: `Pengingat Pembayaran - Kamar ${tenant.rooms.name}`,
              content: ownerEmailBody,
            });
          }

          processedTenants.push({
            tenant_id: tenant.id,
            email: tenant.email,
            due_date: tenant.end_date
          });
        }
      } catch (error) {
        errors.push({
          tenant_id: tenant.id,
          error: error.message
        });
      }
    }

    // Close SMTP connection
    await client.close();

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedTenants.length,
        tenants: processedTenants,
        errors: errors,
        message: `Processed ${processedTenants.length} tenants with ${errors.length} errors`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
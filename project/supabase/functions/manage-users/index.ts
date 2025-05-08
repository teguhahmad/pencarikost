import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create a Supabase client with the user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the user is authorized to access this endpoint
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Check if the user is a superadmin
    const { data: backofficeUser, error: backofficeError } = await userClient
      .from('backoffice_users')
      .select('role')
      .single();

    if (backofficeError || !backofficeUser || backofficeUser.role !== 'superadmin') {
      throw new Error('Unauthorized - Superadmin access required');
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET': {
        // Get all users with their auth details
        const { data: { users }, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;

        // Get backoffice user details
        const { data: backofficeUsers, error: backofficeError } = await supabase
          .from('backoffice_users')
          .select('*');
        if (backofficeError) throw backofficeError;

        // Combine the data
        const combinedUsers = users.map(user => {
          const backofficeData = backofficeUsers.find(bu => bu.user_id === user.id);
          return {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || '',
            role: backofficeData?.role || 'user',
            status: backofficeData?.status || 'inactive',
            created_at: user.created_at,
            last_login: user.last_sign_in_at,
          };
        });

        return new Response(JSON.stringify(combinedUsers), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'POST': {
        const { email, password, name, role } = await req.json();

        // Create the user in Auth
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
        });
        if (createError) throw createError;

        // Create backoffice user entry
        const { error: backofficeError } = await supabase
          .from('backoffice_users')
          .insert([{
            user_id: user.id,
            role,
            status: 'active',
          }]);
        if (backofficeError) throw backofficeError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'PUT': {
        const { userId, email, password, name, role } = await req.json();

        // Update user metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            email,
            password,
            user_metadata: { name },
            email_confirm: true,
          }
        );
        if (updateError) throw updateError;

        // Update backoffice user role
        const { error: backofficeError } = await supabase
          .from('backoffice_users')
          .update({ role })
          .eq('user_id', userId);
        if (backofficeError) throw backofficeError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'DELETE': {
        const { userId } = await req.json();
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
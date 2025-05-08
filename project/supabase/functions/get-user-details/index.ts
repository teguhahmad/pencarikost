import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the requesting user is authorized
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Authentication failed');
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has admin or superadmin role
    const { data: backofficeUser, error: roleError } = await supabase
      .from('backoffice_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.error('Role check error:', roleError);
      throw new Error('Failed to verify user role');
    }

    if (!backofficeUser || !['admin', 'superadmin'].includes(backofficeUser.role)) {
      throw new Error('Unauthorized - Insufficient permissions');
    }

    // Get the user IDs from the request
    const { userIds } = await req.json();
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('Invalid or empty userIds array');
    }

    // Fetch user details for all provided IDs
    const userDetails = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        if (!userId || typeof userId !== 'string') {
          throw new Error(`Invalid user ID: ${userId}`);
        }

        const { data: userData, error: userError } = await supabase.auth.admin
          .getUserById(userId);

        if (userError) {
          throw userError;
        }

        if (!userData?.user) {
          throw new Error(`No user found for ID: ${userId}`);
        }

        userDetails.push({
          id: userData.user.id,
          email: userData.user.email,
          name: userData.user.user_metadata?.full_name || null,
        });
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        errors.push({ userId, error: error.message });
      }
    }

    if (userDetails.length === 0) {
      throw new Error('Failed to fetch any user details');
    }

    return new Response(
      JSON.stringify({ 
        users: userDetails,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error.message.includes('Unauthorized') ? 403 : 400,
      }
    );
  }
});
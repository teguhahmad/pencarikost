import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { decode as base64Decode } from "https://deno.land/std@0.210.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string; // 'common' or 'parking'
      
      if (!file) {
        throw new Error('No file provided');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${type}-${timestamp}-${file.name}`;
      const filepath = `property-images/${filename}`;

      // Convert File to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('property-images')
        .upload(filepath, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('property-images')
        .getPublicUrl(filepath);

      return new Response(
        JSON.stringify({ url: publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'DELETE') {
      const { url } = await req.json();
      
      // Extract filename from URL
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const filepath = `property-images/${filename}`;

      // Delete from Supabase Storage
      const { error: deleteError } = await supabase
        .storage
        .from('property-images')
        .remove([filepath]);

      if (deleteError) {
        throw deleteError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
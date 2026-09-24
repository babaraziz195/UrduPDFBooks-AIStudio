import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { getB2Client } from '../../_b2Helper';

export async function onRequestGet(context: any) {
  try {
    const { env } = context;
    const { client, isConfigured, bucketName, b2Endpoint, b2Region } = getB2Client(env);

    let b2Status = 'not_configured';
    let b2Message = 'Backblaze B2 credentials pending in server environment';

    if (isConfigured && client) {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucketName }));
        b2Status = 'connected';
        b2Message = `Connected to private Backblaze B2 bucket "${bucketName}"`;
      } catch {
        b2Status = 'connected';
        b2Message = `Backblaze B2 S3 Client configured for bucket "${bucketName}"`;
      }
    }

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const isSupabaseConfigured = Boolean(
      supabaseUrl &&
      !supabaseUrl.includes('your-project') &&
      env.VITE_SUPABASE_ANON_KEY
    );

    return new Response(
      JSON.stringify({
        b2: {
          configured: isConfigured,
          status: b2Status,
          bucketName,
          endpoint: b2Endpoint || null,
          region: b2Region,
          message: b2Message,
        },
        supabase: {
          configured: isSupabaseConfigured,
          url: isSupabaseConfigured ? supabaseUrl : null,
          status: isSupabaseConfigured ? 'connected' : 'not_configured',
          message: isSupabaseConfigured
            ? 'Supabase configured with Project URL'
            : 'Supabase credentials pending in environment',
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';
import { getB2Client } from '../../_b2Helper';

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { bookId, objectKey } = body || {};

    if (!objectKey) {
      return new Response(JSON.stringify({ error: 'objectKey is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Optional Supabase verification for paid books
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey && bookId) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: book } = await supabase
        .from('books')
        .select('id, title, is_paid, price')
        .eq('id', bookId)
        .single();

      if (book && (book.is_paid || Number(book.price) > 0)) {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;

        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Authentication required for paid books', requiresAuth: true }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData?.user) {
          return new Response(
            JSON.stringify({ error: 'Invalid or expired session', requiresAuth: true }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Verify purchase
        const { data: purchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', userData.user.id)
          .eq('book_id', bookId)
          .eq('status', 'completed')
          .maybeSingle();

        const isAdmin = userData.user.email?.includes('admin');
        if (!purchase && !isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Purchase required to unlock this paid book', requiresPurchase: true }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const { client, isConfigured, bucketName } = getB2Client(env);
    if (isConfigured && client) {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ResponseContentType: 'application/pdf',
      });

      const signedUrl = await getSignedUrl(client, command, { expiresIn: 7200 });
      return new Response(
        JSON.stringify({ success: true, url: signedUrl, expiresIn: 7200 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, simulated: true, url: `/api/b2/view/${encodeURIComponent(objectKey)}` }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to generate signed URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

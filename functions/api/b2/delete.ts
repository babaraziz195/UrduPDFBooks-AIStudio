import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getB2Client } from '../../_b2Helper';

export async function onRequestDelete(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { key } = body || {};

    if (!key) {
      return new Response(JSON.stringify({ error: 'Object key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { client, isConfigured, bucketName } = getB2Client(env);
    if (isConfigured && client) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );
    }

    return new Response(JSON.stringify({ success: true, message: `Object "${key}" removed from Backblaze B2.` }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Delete failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

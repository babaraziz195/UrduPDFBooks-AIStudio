import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getB2Client } from '../../_b2Helper';

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { filename, contentType, bookId } = body || {};

    if (!filename) {
      return new Response(JSON.stringify({ error: 'Filename is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanBookId = (bookId || 'catalog')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .substring(0, 50);

    const cleanFilename = filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/\.pdf$/i, '');

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const objectKey = `books/${cleanBookId}/${cleanFilename}-${uniqueSuffix}.pdf`;

    const { client, isConfigured, bucketName } = getB2Client(env);

    if (isConfigured && client) {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ContentType: contentType || 'application/pdf',
      });

      const uploadUrl = await getSignedUrl(client, command, { expiresIn: 1800 });

      return new Response(
        JSON.stringify({
          success: true,
          uploadUrl,
          key: objectKey,
          filename,
          viewUrl: `/api/b2/view/${encodeURIComponent(objectKey)}`,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        simulated: true,
        uploadUrl: '/api/b2/upload',
        key: objectKey,
        filename,
        viewUrl: `/api/b2/view/${encodeURIComponent(objectKey)}`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Presigned upload generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

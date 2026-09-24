import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getB2Client } from '../../../_b2Helper';

export async function onRequestGet(context: any) {
  try {
    const { params, env } = context;
    const keyParam = params.key;
    const objectKey = Array.isArray(keyParam) ? keyParam.join('/') : (keyParam || '');

    if (!objectKey) {
      return new Response('Object key required', { status: 400 });
    }

    const { client, isConfigured, bucketName } = getB2Client(env);
    if (isConfigured && client) {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ResponseContentType: 'application/pdf',
      });
      const signedUrl = await getSignedUrl(client, command, { expiresIn: 7200 });
      return Response.redirect(signedUrl, 302);
    }

    // Readable sandbox preview
    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>UrduPDFBooks - Backblaze B2 Reader Preview</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="font-family:system-ui,-apple-system,sans-serif;padding:30px;background:#FAF8F5;color:#1A3E2F;text-align:center;">
    <div style="max-width:540px;margin:40px auto;background:white;padding:32px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.06);border:1px solid #E2DED5;">
      <div style="font-size:40px;margin-bottom:12px;">📚</div>
      <h2 style="margin-top:0;color:#1A3E2F;font-size:22px;">Backblaze B2 Private Storage</h2>
      <p style="color:#666;font-size:13px;line-height:1.6;">Object Key: <code style="background:#f4f1ea;padding:3px 6px;border-radius:4px;word-break:break-all;">${objectKey}</code></p>
      <div style="background:#F4F1EA;padding:16px;border-radius:10px;font-size:13px;text-align:left;margin:24px 0;line-height:1.6;color:#333;border-left:4px solid #C5A869;">
        <strong>Backblaze B2 Storage Architecture:</strong><br />
        Configure B2_KEY_ID, B2_APPLICATION_KEY, and B2_ENDPOINT in Cloudflare Pages Environment Variables to stream PDFs directly.
      </div>
      <a href="/" style="display:inline-block;background:#1A3E2F;color:white;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:600;font-size:13px;">Return to Library</a>
    </div>
  </body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    return new Response(err.message || 'Failed to view PDF', { status: 500 });
  }
}

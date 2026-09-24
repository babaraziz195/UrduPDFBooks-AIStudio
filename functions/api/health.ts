export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'UrduPDFBooks Cloudflare Pages Functions',
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

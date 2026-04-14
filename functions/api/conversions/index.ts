import { getPrisma } from '../../lib/prisma';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env);
  
  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));
  if (!dbConnected) return new Response(JSON.stringify({ error: 'Database not connected' }), { status: 503 });

  const body = await request.json() as any;
  const { type, value, metadata, linkId: bodyLinkId, clickId: bodyClickId } = body;

  // Simple cookie parser for Cloudflare
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
  
  const clickId = cookies.thinksmart_click_id || bodyClickId;
  const linkId = cookies.thinksmart_link_id || bodyLinkId;

  if (!linkId) {
    return new Response(JSON.stringify({ error: 'No link ID found in cookies or request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const conversion = await prisma.conversion.create({
      data: {
        linkId,
        clickId,
        type: type || 'default',
        value: value ? parseFloat(value) : null,
        metadata: metadata || {}
      }
    });
    return new Response(JSON.stringify(conversion), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to record conversion:', error);
    return new Response(JSON.stringify({ error: 'Failed to record conversion' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

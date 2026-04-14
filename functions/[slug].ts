import { getPrisma } from './lib/prisma';
import { UAParser } from 'ua-parser-js';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env, params, next } = context;
  const slug = params.slug as string;
  const url = new URL(request.url);
  const hostname = url.hostname;

  // Skip static files and API routes (Pages Functions might already handle this, but good to be safe)
  if (slug.includes('.') || slug === 'api' || slug === 'dashboard') {
    return next();
  }

  const prisma = getPrisma(env);

  try {
    // DB Lookup (Skipping Redis for now as ioredis isn't edge-compatible without proxy)
    const linkData = await prisma.link.findFirst({
      where: {
        slug,
        domain: { hostname }
      },
      include: {
        targetingRules: true,
        abTests: true,
        domain: true
      }
    });

    if (!linkData) {
      const domain = await prisma.domain.findUnique({ where: { hostname } });
      if (domain?.error404Redirect) {
        return Response.redirect(domain.error404Redirect, 302);
      }
      return next();
    }

    // Analytics Tracking
    const ip = request.headers.get('cf-connecting-ip') || '';
    const cf = (request as any).cf; // Cloudflare Geo Data
    const parser = new UAParser(request.headers.get('user-agent') || '');
    const ua = parser.getResult();
    const referrer = request.headers.get('referer') || 'Direct';

    // Determine Target URL
    let targetUrl = linkData.originalUrl;

    // 1. Targeting (Geo/Device)
    if (linkData.targetingRules?.length > 0) {
      for (const rule of linkData.targetingRules) {
        if (rule.type === 'GEO' && cf?.country === rule.value) {
          targetUrl = rule.targetUrl;
          break;
        }
        if (rule.type === 'DEVICE' && ua.device.type === rule.value) {
          targetUrl = rule.targetUrl;
          break;
        }
      }
    }

    // 2. A/B Testing
    if (linkData.abTests?.length > 0) {
      const test = linkData.abTests[0];
      if (Math.random() * 100 > test.weightA) {
        targetUrl = test.targetUrlB;
      }
    }

    // 3. Expiration Check
    if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
      return new Response('Link expired', { status: 410 });
    }

    // Create Click Record
    const click = await prisma.click.create({
      data: {
        linkId: linkData.id,
        ip,
        country: cf?.country,
        city: cf?.city,
        device: ua.device.type || 'desktop',
        os: ua.os.name,
        browser: ua.browser.name,
        referrer: referrer,
        utmSource: linkData.utmSource,
        utmMedium: linkData.utmMedium,
        utmCampaign: linkData.utmCampaign,
      }
    });

    // Prepare response
    let response: Response;
    const statusCode = linkData.isCloaked ? 200 : 301;

    if (linkData.isCloaked) {
      response = new Response(`
        <html>
          <head><title>${linkData.title || 'Redirecting...'}</title></head>
          <body style="margin:0;padding:0;overflow:hidden;">
            <iframe src="${targetUrl}" frameborder="0" style="width:100%;height:100vh;"></iframe>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      response = Response.redirect(targetUrl, statusCode);
    }

    // Set Tracking Cookies
    const cookieOptions = 'Path=/; Max-Age=2592000; HttpOnly; SameSite=None; Secure';
    response.headers.append('Set-Cookie', `thinksmart_click_id=${click.id}; ${cookieOptions}`);
    response.headers.append('Set-Cookie', `thinksmart_link_id=${linkData.id}; ${cookieOptions}`);

    return response;

  } catch (error) {
    console.error('Redirect Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

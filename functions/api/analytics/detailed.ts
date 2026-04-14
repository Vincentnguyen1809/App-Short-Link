import { getPrisma } from '../../lib/prisma';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env);

  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));
  if (!dbConnected) {
    return new Response(JSON.stringify({ geos: [], devices: [], oss: [], browsers: [], referrers: [], conversions: { total: 0, rate: '0.00' } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const linkId = url.searchParams.get('linkId');
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    const where: any = {};
    if (linkId) where.linkId = linkId;
    if (start || end) {
      where.timestamp = {};
      if (start) where.timestamp.gte = new Date(start);
      if (end) where.timestamp.lte = new Date(end);
    }

    const [geos, cities, devices, oss, browsers, referrers, topLinks, utmSources, utmMediums, totalClicks, totalConversions] = await Promise.all([
      prisma.click.groupBy({ by: ['country'], where, _count: { _all: true }, orderBy: { _count: { country: 'desc' } }, take: 7 }),
      prisma.click.groupBy({ by: ['city'], where, _count: { _all: true }, orderBy: { _count: { city: 'desc' } }, take: 7 }),
      prisma.click.groupBy({ by: ['device'], where, _count: { _all: true }, orderBy: { _count: { device: 'desc' } } }),
      prisma.click.groupBy({ by: ['os'], where, _count: { _all: true }, orderBy: { _count: { os: 'desc' } }, take: 7 }),
      prisma.click.groupBy({ by: ['browser'], where, _count: { _all: true }, orderBy: { _count: { browser: 'desc' } }, take: 7 }),
      prisma.click.groupBy({ by: ['referrer'], where, _count: { _all: true }, orderBy: { _count: { referrer: 'desc' } }, take: 7 }),
      prisma.click.groupBy({ by: ['linkId'], where, _count: { _all: true }, orderBy: { _count: { linkId: 'desc' } }, take: 7 }),
      prisma.click.groupBy({ by: ['utmSource'], where, _count: { _all: true }, orderBy: { _count: { utmSource: 'desc' } }, take: 7 }),
      prisma.click.groupBy({ by: ['utmMedium'], where, _count: { _all: true }, orderBy: { _count: { utmMedium: 'desc' } }, take: 7 }),
      prisma.click.count({ where }),
      prisma.conversion.count({ where })
    ]);

    const topLinksWithTitles = await Promise.all(topLinks.map(async (item: any) => {
      const link = await prisma.link.findUnique({ where: { id: item.linkId }, select: { title: true, slug: true } });
      return { ...item, title: link?.title || link?.slug || 'Unknown' };
    }));

    const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00';

    return new Response(JSON.stringify({ 
      geos, cities, devices, oss, browsers, referrers,
      utmSources, utmMediums, topLinks: topLinksWithTitles,
      totalClicks, conversions: { total: totalConversions, rate: conversionRate }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch detailed analytics:', error);
    return new Response(JSON.stringify({ geos: [], devices: [], oss: [], browsers: [], referrers: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

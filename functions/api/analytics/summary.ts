import { getPrisma } from '../../lib/prisma';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env);

  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));
  if (!dbConnected) return new Response(JSON.stringify({ totalClicks: 0, uniqueVisitors: 0, dbConnected: false }), { headers: { 'Content-Type': 'application/json' } });

  try {
    const url = new URL(request.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    
    const where: any = {};
    if (start || end) {
      where.timestamp = {};
      if (start) where.timestamp.gte = new Date(start);
      if (end) where.timestamp.lte = new Date(end);
    }

    const totalClicks = await prisma.click.count({ where });
    const uniqueVisitors = await prisma.click.groupBy({
      by: ['ip'],
      where
    }).then(res => res.length);
    
    return new Response(JSON.stringify({ totalClicks, uniqueVisitors, dbConnected: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch analytics summary:', error);
    return new Response(JSON.stringify({ totalClicks: 0, uniqueVisitors: 0, dbConnected: false }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

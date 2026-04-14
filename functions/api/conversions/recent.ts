import { getPrisma } from '../../lib/prisma';

export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context;
  const prisma = getPrisma(env);

  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));
  if (!dbConnected) return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });

  try {
    const conversions = await prisma.conversion.findMany({
      include: {
        link: {
          include: { domain: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    return new Response(JSON.stringify(conversions), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch recent conversions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch recent conversions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

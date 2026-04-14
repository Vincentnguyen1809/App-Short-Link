import { getPrisma } from '../../lib/prisma';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env);

  const authHeader = request.headers.get('Authorization');
  let userRole = 'MEMBER';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = JSON.parse(atob(token));
      userRole = payload.role;
    } catch (e) {
      console.error('Failed to parse token', e);
    }
  }

  if (userRole !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));
  if (!dbConnected) return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
      orderBy: {
        email: 'asc'
      }
    });

    return new Response(JSON.stringify(users), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
  }
};

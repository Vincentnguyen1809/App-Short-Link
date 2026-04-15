import { getPrisma } from '../../lib/prisma';

export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context;
  const prisma = getPrisma(env);

  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));
  if (!dbConnected) return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });

  try {
    const domains = await prisma.domain.findMany();
    return new Response(JSON.stringify(domains), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch domains:', error);
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
  }
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env);
  const { hostname, mainPageRedirect, error404Redirect } = await request.json() as any;

  const authHeader = request.headers.get('Authorization');
  let userRole = 'MEMBER';
  let userId = 'default-user';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = JSON.parse(atob(token));
      userRole = payload.role;
      userId = payload.id || 'default-user';
    } catch (e) {
      console.error('Failed to parse token', e);
    }
  }

  if (userRole !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  try {
    const domain = await prisma.domain.create({
      data: {
        hostname,
        mainPageRedirect,
        error404Redirect,
        workspaceId: 'default-workspace',
        dnsStatus: 'configured',
        sslStatus: 'active',
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'CREATE',
        entityType: 'DOMAIN',
        entityId: domain.id,
        details: { hostname: domain.hostname },
        workspaceId: 'default-workspace'
      }
    });

    return new Response(JSON.stringify(domain), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create domain' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

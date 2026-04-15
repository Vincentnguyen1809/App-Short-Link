import { requireAuth } from '../../lib/auth';
import { getPrisma } from '../../lib/prisma';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env as { DATABASE_URL: string });

  const databaseUrl = (env as { DATABASE_URL?: string }).DATABASE_URL;
  const jwtSecret = (env as { JWT_SECRET?: string }).JWT_SECRET;

  if (!databaseUrl?.startsWith('prisma://')) {
    return json({ error: 'DATABASE_URL must use Prisma Accelerate (prisma://...)' }, 503);
  }

  if (!jwtSecret) {
    return json({ error: 'JWT_SECRET is missing.' }, 503);
  }

  const auth = await requireAuth(request, jwtSecret);
  if (!auth) {
    return json({ error: 'Unauthorized' }, 403);
  }

  try {
    const domains = await prisma.domain.findMany();
    return json(domains);
  } catch (error) {
    console.error('Failed to fetch domains:', error);
    return json([], 500);
  }
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env as { DATABASE_URL: string });
  const { hostname, mainPageRedirect, error404Redirect } = (await request.json()) as any;

  const databaseUrl = (env as { DATABASE_URL?: string }).DATABASE_URL;
  const jwtSecret = (env as { JWT_SECRET?: string }).JWT_SECRET;

  if (!databaseUrl?.startsWith('prisma://')) {
    return json({ error: 'DATABASE_URL must use Prisma Accelerate (prisma://...)' }, 503);
  }

  if (!jwtSecret) {
    return json({ error: 'JWT_SECRET is missing.' }, 503);
  }

  const auth = await requireAuth(request, jwtSecret);
  if (!auth || auth.role !== 'ADMIN') {
    return json({ error: 'Unauthorized' }, 403);
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
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.id,
        action: 'CREATE',
        entityType: 'DOMAIN',
        entityId: domain.id,
        details: { hostname: domain.hostname },
        workspaceId: 'default-workspace',
      },
    });

    return json(domain);
  } catch {
    return json({ error: 'Failed to create domain' }, 500);
  }
};

import { requireAuth } from '../lib/auth';
import { getPrisma } from '../lib/prisma';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context;
  const prisma = getPrisma(env as { DATABASE_URL: string });

  try {
    const workspace = await prisma.workspace.findFirst({
      where: { id: 'default-workspace' },
    });
    return json(workspace);
  } catch {
    return json({ error: 'Failed to fetch workspace' }, 500);
  }
};

export const onRequestPatch: PagesFunction = async (context) => {
  const { request, env } = context;
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

  const prisma = getPrisma(env as { DATABASE_URL: string });
  const body = await request.json();

  try {
    const workspace = await prisma.workspace.update({
      where: { id: 'default-workspace' },
      data: body as object,
    });
    return json(workspace);
  } catch {
    return json({ error: 'Failed to update workspace' }, 500);
  }
};

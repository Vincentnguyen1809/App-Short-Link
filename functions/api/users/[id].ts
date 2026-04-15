import { requireAuth } from '../../lib/auth';
import { getPrisma } from '../../lib/prisma';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestPatch: PagesFunction = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;
  const data = (await request.json()) as { status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED'; role?: 'ADMIN' | 'MANAGER' | 'MEMBER' };

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

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: data.status,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    return json(user);
  } catch {
    return json({ error: 'Failed to update user' }, 500);
  }
};

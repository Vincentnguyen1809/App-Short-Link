import { getPrisma } from '../../lib/prisma';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function serializeError(error: unknown) {
  const err = error as Error & { cause?: unknown };
  return {
    name: err?.name ?? 'UnknownError',
    message: err?.message ?? String(error),
    stack: err?.stack ?? null,
    cause: err?.cause ?? null,
    raw: String(error),
  };
}

async function hashPassword(rawPassword: string) {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawPassword));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const { request, env } = context;
    const body = (await request.json()) as { email?: string; password?: string };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return json({ error: 'Email and password are required.' }, 400);
    }

    if (!(env as { DATABASE_URL?: string }).DATABASE_URL?.startsWith('prisma://')) {
      return json(
        {
          error: 'DATABASE_URL must be a Prisma Accelerate connection string (prisma://...).',
        },
        503,
      );
    }

    const prisma = getPrisma(env as { DATABASE_URL: string });
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return json({ error: 'Invalid email or password.' }, 401);
    }

    const hashedPassword = await hashPassword(password);
    if (user.password !== hashedPassword) {
      return json({ error: 'Invalid email or password.' }, 401);
    }

    if (user.status === 'PENDING') {
      return json({ error: 'Account is not verified yet.' }, 403);
    }

    if (user.status === 'SUSPENDED') {
      return json({ error: 'Account is suspended.' }, 403);
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = btoa(JSON.stringify(tokenPayload));

    return json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return json({ error: serializeError(error) }, 500);
  }
};

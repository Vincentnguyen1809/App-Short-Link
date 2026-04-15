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
    const body = (await request.json()) as { token?: string; password?: string };

    const token = body.token?.trim();
    const password = body.password?.trim();

    if (!token || !password) {
      return json({ error: 'Token and new password are required.' }, 400);
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
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return json({ error: 'Invalid or expired reset token.' }, 400);
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    return json({ error: serializeError(error) }, 500);
  }
};

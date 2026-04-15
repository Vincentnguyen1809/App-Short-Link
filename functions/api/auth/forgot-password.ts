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

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const { request, env } = context;
    const body = (await request.json()) as { email?: string };

    const email = body.email?.trim().toLowerCase();
    if (!email) {
      return json({ error: 'Email is required.' }, 400);
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
      return json({ message: 'If the email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const resendApiKey = (env as { RESEND_API_KEY?: string }).RESEND_API_KEY;
    const domain = (env as { DOMAIN?: string }).DOMAIN || new URL(request.url).origin;

    if (resendApiKey) {
      const resetLink = `${domain}/reset-password?token=${resetToken}`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'App Short Link <noreply@example.com>',
          to: email,
          subject: 'Reset your password',
          html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
        }),
      });
    }

    return json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    return json({ error: serializeError(error) }, 500);
  }
};

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
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const name = body.name?.trim();

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

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return json({ error: 'Email is already in use.' }, 409);
    }

    const verificationToken = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'MEMBER',
        status: 'PENDING',
        verificationToken,
      },
    });

    const resendApiKey = (env as { RESEND_API_KEY?: string }).RESEND_API_KEY;
    const domain = (env as { DOMAIN?: string }).DOMAIN || new URL(request.url).origin;

    if (resendApiKey) {
      const verifyLink = `${domain}/api/auth/verify?token=${verificationToken}`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'App Short Link <noreply@example.com>',
          to: email,
          subject: 'Verify your account',
          html: `<p>Hi ${name || email}, click <a href="${verifyLink}">here</a> to verify your account.</p>`,
        }),
      });
    }

    return json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    return json({ error: serializeError(error) }, 500);
  }
};

import { getPrisma } from '../../lib/prisma';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const { email, password } = await request.json() as any;

  const prisma = getPrisma(env);
  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));

  if (!dbConnected) {
    // Fallback to mock auth if DB is not connected
    if (email === 'admin@thinksmartins.com' && password === 'admin123') {
      return new Response(JSON.stringify({ 
        token: btoa(JSON.stringify({ email, role: 'ADMIN' })), // Mock JWT
        user: { email, name: 'Admin', role: 'ADMIN' } 
      }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Database not connected' }), { status: 503 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.passwordHash !== password) {
      return new Response(JSON.stringify({ error: 'Email hoặc mật khẩu không chính xác' }), { status: 401 });
    }

    if (user.status === 'PENDING') {
      return new Response(JSON.stringify({ error: 'Tài khoản chưa được xác nhận. Vui lòng kiểm tra email.' }), { status: 403 });
    }

    if (user.status === 'SUSPENDED') {
      return new Response(JSON.stringify({ error: 'Tài khoản đã bị khóa.' }), { status: 403 });
    }

    // In a real app, sign a proper JWT. For this demo, we create a simple base64 encoded payload.
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    const token = btoa(JSON.stringify(tokenPayload));

    return new Response(JSON.stringify({ 
      token, 
      user: { email: user.email, name: user.name, role: user.role } 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("RAW ERROR LOG:", error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown Error',
      name: error.name || 'No Name',
      stack: error.stack || 'No Stack',
      full: String(error)
    }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

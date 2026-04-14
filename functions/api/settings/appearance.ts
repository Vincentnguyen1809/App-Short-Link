import { getPrisma } from '../../lib/prisma';

export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context;
  const prisma = getPrisma(env);

  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));
  if (!dbConnected) {
    return new Response(JSON.stringify({ 
      backgroundUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=2070",
      logoUrl: null
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  try {
    let settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });
    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: 'global' } });
    }
    return new Response(JSON.stringify(settings), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      backgroundUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=2070",
      logoUrl: null
    }), { headers: { 'Content-Type': 'application/json' } });
  }
};

export const onRequestPatch: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env);
  const { backgroundUrl, logoUrl } = await request.json() as any;

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

  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: 'global' },
      update: { backgroundUrl, logoUrl },
      create: { id: 'global', backgroundUrl, logoUrl }
    });
    return new Response(JSON.stringify(settings), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

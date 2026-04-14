import { getPrisma } from '../lib/prisma';

export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context;
  const prisma = getPrisma(env);

  try {
    const workspace = await prisma.workspace.findFirst({
      where: { id: 'default-workspace' }
    });
    return new Response(JSON.stringify(workspace), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch workspace' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPatch: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env);
  const body = await request.json() as any;

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
    const workspace = await prisma.workspace.update({
      where: { id: 'default-workspace' },
      data: body
    });
    return new Response(JSON.stringify(workspace), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update workspace' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

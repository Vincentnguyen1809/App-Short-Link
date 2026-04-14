import { getPrisma } from '../../lib/prisma';

export const onRequestPatch: PagesFunction = async (context) => {
  const { request, env, params } = context;
  const prisma = getPrisma(env);
  const id = params.id as string;
  const data = await request.json() as any;

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
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: data.status,
        role: data.role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      }
    });
    return new Response(JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

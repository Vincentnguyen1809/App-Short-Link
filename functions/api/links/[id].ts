import { getPrisma } from '../../lib/prisma';

async function checkLinkOwnership(request: Request, prisma: any, linkId: string) {
  const authHeader = request.headers.get('Authorization');
  let userRole = 'MEMBER';
  let userId = 'default-user';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = JSON.parse(atob(token));
      userRole = payload.role;
      userId = payload.id || 'default-user';
    } catch (e) {
      console.error('Failed to parse token', e);
    }
  }

  if (userRole === 'ADMIN') return true;

  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link) return false;

  return link.creatorId === userId;
}

export const onRequestPatch: PagesFunction = async (context) => {
  const { request, env, params } = context;
  const prisma = getPrisma(env);
  const id = params.id as string;
  const data = await request.json() as any;

  const isOwner = await checkLinkOwnership(request, prisma, id);
  if (!isOwner) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  try {
    const link = await prisma.link.update({
      where: { id },
      data
    });
    return new Response(JSON.stringify(link), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestDelete: PagesFunction = async (context) => {
  const { request, env, params } = context;
  const prisma = getPrisma(env);
  const id = params.id as string;

  const isOwner = await checkLinkOwnership(request, prisma, id);
  if (!isOwner) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  try {
    await prisma.link.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

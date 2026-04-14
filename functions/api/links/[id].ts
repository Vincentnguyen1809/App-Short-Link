import { getPrisma } from '../../lib/prisma';

export const onRequestPatch: PagesFunction = async (context) => {
  const { request, env, params } = context;
  const prisma = getPrisma(env);
  const id = params.id as string;
  const data = await request.json() as any;

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
  const { env, params } = context;
  const prisma = getPrisma(env);
  const id = params.id as string;

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

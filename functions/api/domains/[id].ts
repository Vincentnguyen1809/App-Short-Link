import { getPrisma } from '../../lib/prisma';

export const onRequestPatch: PagesFunction = async (context) => {
  const { request, env, params } = context;
  const prisma = getPrisma(env);
  const id = params.id as string;
  const data = await request.json() as any;

  try {
    const domain = await prisma.domain.update({
      where: { id },
      data
    });
    return new Response(JSON.stringify(domain), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update domain' }), {
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
    await prisma.domain.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete domain' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

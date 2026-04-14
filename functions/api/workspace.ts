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

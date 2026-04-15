import { requireAuth } from '../../lib/auth';
import { getPrisma } from '../../lib/prisma';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env as { DATABASE_URL: string });

  const url = new URL(request.url);
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const order = url.searchParams.get('order') || 'desc';
  const search = url.searchParams.get('search') || '';

  const databaseUrl = (env as { DATABASE_URL?: string }).DATABASE_URL;
  const jwtSecret = (env as { JWT_SECRET?: string }).JWT_SECRET;

  if (!databaseUrl?.startsWith('prisma://')) {
    return json({ error: 'DATABASE_URL must use Prisma Accelerate (prisma://...)' }, 503);
  }

  if (!jwtSecret) {
    return json({ error: 'JWT_SECRET is missing.' }, 503);
  }

  const auth = await requireAuth(request, jwtSecret);
  if (!auth) {
    return json({ error: 'Unauthorized' }, 403);
  }

  const userRole = auth.role;
  const userId = auth.id;

  try {
    const validSortFields = ['createdAt', 'clicks', 'conversions', 'title', 'slug'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const whereClause: any = {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { originalUrl: { contains: search, mode: 'insensitive' } },
      ],
    };

    if (userRole === 'MEMBER') {
      whereClause.creatorId = userId;
    }

    const links = await prisma.link.findMany({
      where: whereClause,
      include: {
        domain: true,
        tags: true,
        _count: {
          select: { clicks: true, conversions: true },
        },
      },
      orderBy:
        sortField === 'clicks' || sortField === 'conversions'
          ? { [sortField]: { _count: sortOrder } }
          : { [sortField]: sortOrder },
    });

    const formattedLinks = links.map((link: any) => ({
      ...link,
      clicks: link._count.clicks,
      conversions: link._count.conversions,
      conversionRate:
        link._count.clicks > 0 ? ((link._count.conversions / link._count.clicks) * 100).toFixed(2) : 0,
    }));

    return json(formattedLinks);
  } catch (error) {
    console.error('Failed to fetch links:', error);
    return json([], 500);
  }
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env as { DATABASE_URL: string });
  const { originalUrl, slug, domainId, title, utmSource, utmMedium, utmCampaign, isCloaked, password } =
    (await request.json()) as any;

  const databaseUrl = (env as { DATABASE_URL?: string }).DATABASE_URL;
  const jwtSecret = (env as { JWT_SECRET?: string }).JWT_SECRET;

  if (!databaseUrl?.startsWith('prisma://')) {
    return json({ error: 'DATABASE_URL must use Prisma Accelerate (prisma://...)' }, 503);
  }

  if (!jwtSecret) {
    return json({ error: 'JWT_SECRET is missing.' }, 503);
  }

  const auth = await requireAuth(request, jwtSecret);
  if (!auth) {
    return json({ error: 'Unauthorized' }, 403);
  }

  try {
    const link = await prisma.link.create({
      data: {
        originalUrl,
        slug: slug || Math.random().toString(36).substring(2, 8),
        domainId,
        title,
        utmSource,
        utmMedium,
        utmCampaign,
        isCloaked,
        password,
        workspaceId: 'default-workspace',
        creatorId: auth.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.id,
        action: 'CREATE',
        entityType: 'LINK',
        entityId: link.id,
        details: { slug: link.slug, title: link.title },
        workspaceId: 'default-workspace',
      },
    });

    return json(link);
  } catch (error) {
    console.error('Failed to create link:', error);
    return json({ error: 'Failed to create link' }, 500);
  }
};

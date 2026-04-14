import { getPrisma } from '../../lib/prisma';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env);
  
  const url = new URL(request.url);
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const order = url.searchParams.get('order') || 'desc';
  const search = url.searchParams.get('search') || '';

  // Parse Authorization header
  const authHeader = request.headers.get('Authorization');
  let userRole = 'ADMIN';
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

  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));
  if (!dbConnected) return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });

  try {
    const validSortFields = ['createdAt', 'clicks', 'conversions', 'title', 'slug'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const whereClause: any = {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { originalUrl: { contains: search, mode: 'insensitive' } },
      ]
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
          select: { clicks: true, conversions: true }
        }
      },
      orderBy: sortField === 'clicks' || sortField === 'conversions' 
        ? { [sortField]: { _count: sortOrder } }
        : { [sortField]: sortOrder }
    });

    const formattedLinks = links.map((link: any) => ({
      ...link,
      clicks: link._count.clicks,
      conversions: link._count.conversions,
      conversionRate: link._count.clicks > 0 
        ? ((link._count.conversions / link._count.clicks) * 100).toFixed(2) 
        : 0
    }));

    return new Response(JSON.stringify(formattedLinks), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch links:', error);
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
  }
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const prisma = getPrisma(env);
  const { originalUrl, slug, domainId, title, utmSource, utmMedium, utmCampaign, isCloaked, password } = await request.json() as any;

  // Parse Authorization header
  const authHeader = request.headers.get('Authorization');
  let userId = 'default-user';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = JSON.parse(atob(token));
      userId = payload.id || 'default-user';
    } catch (e) {
      console.error('Failed to parse token', e);
    }
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
        creatorId: userId,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'CREATE',
        entityType: 'LINK',
        entityId: link.id,
        details: { slug: link.slug, title: link.title },
        workspaceId: 'default-workspace'
      }
    });

    return new Response(JSON.stringify(link), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to create link:', error);
    return new Response(JSON.stringify({ error: 'Failed to create link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { prisma } from './src/lib/prisma';
import { redis, getCachedLink, setCachedLink } from './src/lib/redis';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cookieParser());
  app.use(express.json());

  // 1. Redirect Logic (High Priority)
  app.get('/:slug', async (req, res, next) => {
    const { slug } = req.params;
    const hostname = req.hostname;

    // Skip static files and API routes
    if (slug.includes('.') || slug === 'api' || slug === 'dashboard') {
      return next();
    }

    try {
      // Check Cache
      let linkData = await getCachedLink(hostname, slug);

      if (!linkData) {
        // DB Lookup
        const link = await prisma.link.findFirst({
          where: {
            slug,
            domain: { hostname }
          },
          include: {
            targetingRules: true,
            abTests: true,
            domain: true
          }
        });

        if (!link) {
          // Handle 404 Redirect for Domain
          const domain = await prisma.domain.findUnique({ where: { hostname } });
          if (domain?.error404Redirect) {
            return res.redirect(302, domain.error404Redirect);
          }
          return next();
        }
        linkData = link;
        await setCachedLink(hostname, slug, linkData);
      }

      // Analytics Tracking
      const ip = req.ip || req.headers['x-forwarded-for']?.toString() || '';
      const parser = new UAParser(req.headers['user-agent']);
      const ua = parser.getResult();
      const geo = geoip.lookup(ip);
      const referrer = req.headers.referer || req.headers.referrer || 'Direct';

      // Determine Target URL
      let targetUrl = linkData.originalUrl;

      // 1. Targeting (Geo/Device)
      if (linkData.targetingRules?.length > 0) {
        for (const rule of linkData.targetingRules) {
          if (rule.type === 'GEO' && geo?.country === rule.value) {
            targetUrl = rule.targetUrl;
            break;
          }
          if (rule.type === 'DEVICE' && ua.device.type === rule.value) {
            targetUrl = rule.targetUrl;
            break;
          }
        }
      }

      // 2. A/B Testing
      if (linkData.abTests?.length > 0) {
        const test = linkData.abTests[0];
        if (Math.random() * 100 > test.weightA) {
          targetUrl = test.targetUrlB;
        }
      }

      // 3. Expiration Check
      if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
        return res.status(410).send('Link expired');
      }

      // Create Click Record
      const click = await prisma.click.create({
        data: {
          linkId: linkData.id,
          ip,
          country: geo?.country,
          city: geo?.city,
          device: ua.device.type || 'desktop',
          os: ua.os.name,
          browser: ua.browser.name,
          referrer: referrer.toString(),
          utmSource: linkData.utmSource,
          utmMedium: linkData.utmMedium,
          utmCampaign: linkData.utmCampaign,
        }
      });

      // Set Tracking Cookie (expires in 30 days)
      res.cookie('thinksmart_click_id', click.id, { 
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
        sameSite: 'none',
        secure: true 
      });
      res.cookie('thinksmart_link_id', linkData.id, { 
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
        sameSite: 'none',
        secure: true 
      });

      // Redirect
      const statusCode = linkData.isCloaked ? 200 : 301;
      if (linkData.isCloaked) {
        // Cloaking: Render an iframe or similar
        return res.send(`
          <html>
            <head><title>${linkData.title || 'Redirecting...'}</title></head>
            <body style="margin:0;padding:0;overflow:hidden;">
              <iframe src="${targetUrl}" frameborder="0" style="width:100%;height:100vh;"></iframe>
            </body>
          </html>
        `);
      }

      return res.redirect(statusCode, targetUrl);

    } catch (error) {
      console.error('Redirect Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // 2. API Routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Mock user storage for demo purposes
  const pendingUsers: any[] = [];

  // Auth API
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simple mock authentication
    if (email === 'admin@thinksmartins.com' && password === 'admin123') {
      res.json({ token: 'mock-jwt-token-123', user: { email, name: 'Admin', role: 'ADMIN' } });
    } else {
      res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác hoặc tài khoản chưa được phê duyệt' });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    
    pendingUsers.push({ email, password, name, status: 'PENDING', createdAt: new Date() });
    res.json({ message: 'Đăng ký thành công. Vui lòng chờ Admin phê duyệt tài khoản của bạn.' });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Vui lòng nhập email' });
    
    // In a real app, this would send an actual email
    console.log(`Password reset requested for: ${email}`);
    res.json({ message: 'Yêu cầu đã được gửi. Vui lòng kiểm tra email của bạn để lấy lại mật khẩu.' });
  });

  // App Settings API
  app.get('/api/settings/appearance', async (req, res) => {
    const dbConnected = !!process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));
    if (!dbConnected) {
      return res.json({ 
        backgroundUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=2070",
        logoUrl: null
      });
    }

    try {
      let settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });
      if (!settings) {
        settings = await prisma.appSettings.create({ data: { id: 'global' } });
      }
      res.json(settings);
    } catch (error) {
      res.json({ 
        backgroundUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=2070",
        logoUrl: null
      });
    }
  });

  app.patch('/api/settings/appearance', async (req, res) => {
    const { backgroundUrl, logoUrl } = req.body;
    try {
      const settings = await prisma.appSettings.upsert({
        where: { id: 'global' },
        update: { backgroundUrl, logoUrl },
        create: { id: 'global', backgroundUrl, logoUrl }
      });
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Links API
  app.get('/api/links', async (req, res) => {
    const dbConnected = !!process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));
    if (!dbConnected) return res.json([]);
    try {
      const { sortBy = 'createdAt', order = 'desc', search = '' } = req.query;
      
      // Validate sort field
      const validSortFields = ['createdAt', 'clicks', 'conversions', 'title', 'slug'];
      const sortField = validSortFields.includes(String(sortBy)) ? String(sortBy) : 'createdAt';
      const sortOrder = order === 'asc' ? 'asc' : 'desc';

      const links = await prisma.link.findMany({
        where: {
          OR: [
            { title: { contains: String(search), mode: 'insensitive' } },
            { slug: { contains: String(search), mode: 'insensitive' } },
            { originalUrl: { contains: String(search), mode: 'insensitive' } },
          ]
        },
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

      // Map to flatten counts for easier frontend use
      const formattedLinks = links.map(link => ({
        ...link,
        clicks: link._count.clicks,
        conversions: link._count.conversions,
        conversionRate: link._count.clicks > 0 
          ? ((link._count.conversions / link._count.clicks) * 100).toFixed(2) 
          : 0
      }));

      res.json(formattedLinks);
    } catch (error) {
      console.error('Failed to fetch links:', error);
      res.json([]);
    }
  });

  // Conversion Tracking API
  app.get('/api/conversions/recent', async (req, res) => {
    const dbConnected = !!process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));
    if (!dbConnected) return res.json([]);
    
    try {
      const conversions = await prisma.conversion.findMany({
        include: {
          link: {
            include: { domain: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 100
      });
      res.json(conversions);
    } catch (error) {
      console.error('Failed to fetch recent conversions:', error);
      res.status(500).json({ error: 'Failed to fetch recent conversions' });
    }
  });

  app.post('/api/conversions', async (req, res) => {
    const dbConnected = !!process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));
    if (!dbConnected) return res.status(503).json({ error: 'Database not connected' });

    const { type, value, metadata, linkId: bodyLinkId, clickId: bodyClickId } = req.body;
    const clickId = req.cookies.thinksmart_click_id || bodyClickId;
    const linkId = req.cookies.thinksmart_link_id || bodyLinkId;

    if (!linkId) {
      return res.status(400).json({ error: 'No link ID found in cookies or request body' });
    }

    try {
      const conversion = await prisma.conversion.create({
        data: {
          linkId,
          clickId,
          type: type || 'default',
          value: value ? parseFloat(value) : null,
          metadata: metadata || {}
        }
      });
      res.json(conversion);
    } catch (error) {
      console.error('Failed to record conversion:', error);
      res.status(500).json({ error: 'Failed to record conversion' });
    }
  });

  // Tracking Script Endpoint
  app.get('/api/tracking/script.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
      (function() {
        window.Thinksmart = {
          track: function(type, value, metadata) {
            return fetch('/api/conversions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, value, metadata })
            }).then(res => res.json());
          }
        };
      })();
    `);
  });

  app.delete('/api/links/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.link.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete link' });
    }
  });

  app.patch('/api/links/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
      const link = await prisma.link.update({
        where: { id },
        data
      });
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update link' });
    }
  });

  app.post('/api/links', async (req, res) => {
    const { originalUrl, slug, domainId, title, utmSource, utmMedium, utmCampaign, isCloaked, password } = req.body;
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
          workspaceId: 'default-workspace', // Placeholder
          creatorId: 'default-user', // Placeholder
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: 'default-user',
          action: 'CREATE',
          entityType: 'LINK',
          entityId: link.id,
          details: { slug: link.slug, title: link.title },
          workspaceId: 'default-workspace'
        }
      });
      // Clear cache for this slug
      const domain = await prisma.domain.findUnique({ where: { id: domainId } });
      if (domain) {
        await redis.del(`link:${domain.hostname}:${link.slug}`);
      }
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create link' });
    }
  });

  // Domains API
  app.get('/api/domains', async (req, res) => {
    const dbConnected = !!process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));
    if (!dbConnected) return res.json([]);
    try {
      const domains = await prisma.domain.findMany();
      res.json(domains);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      res.json([]);
    }
  });

  app.post('/api/domains', async (req, res) => {
    const { hostname, mainPageRedirect, error404Redirect } = req.body;
    try {
      const domain = await prisma.domain.create({
        data: {
          hostname,
          mainPageRedirect,
          error404Redirect,
          workspaceId: 'default-workspace', // Placeholder
          dnsStatus: 'configured', // Mocking for demo
          sslStatus: 'active', // Mocking for demo
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: 'default-user',
          action: 'CREATE',
          entityType: 'DOMAIN',
          entityId: domain.id,
          details: { hostname: domain.hostname },
          workspaceId: 'default-workspace'
        }
      });
      res.json(domain);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create domain' });
    }
  });

  app.delete('/api/domains/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.domain.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete domain' });
    }
  });

  app.patch('/api/domains/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const domain = await prisma.domain.update({
        where: { id },
        data: req.body
      });
      res.json(domain);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update domain' });
    }
  });

  // Audit Logs API
  app.get('/api/audit-logs', async (req, res) => {
    const dbConnected = !!process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));
    if (!dbConnected) return res.json([]);
    try {
      const logs = await prisma.auditLog.findMany({
        include: { user: true },
        orderBy: { timestamp: 'desc' },
        take: 50
      });
      res.json(logs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      res.json([]);
    }
  });

  // Detailed Analytics API
  app.get('/api/analytics/detailed', async (req, res) => {
    const dbConnected = !!process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));
    
    if (!dbConnected) {
      return res.json({ geos: [], devices: [], oss: [], browsers: [], referrers: [], conversions: { total: 0, rate: '0.00' } });
    }

    try {
      const { linkId, start, end } = req.query;
      const where: any = {};
      if (linkId) where.linkId = String(linkId);
      if (start || end) {
        where.timestamp = {};
        if (start) where.timestamp.gte = new Date(String(start));
        if (end) where.timestamp.lte = new Date(String(end));
      }

      const [geos, cities, devices, oss, browsers, referrers, topLinks, utmSources, utmMediums, totalClicks, totalConversions] = await Promise.all([
        prisma.click.groupBy({
          by: ['country'],
          where,
          _count: { _all: true },
          orderBy: { _count: { country: 'desc' } },
          take: 7
        }),
        prisma.click.groupBy({
          by: ['city'],
          where,
          _count: { _all: true },
          orderBy: { _count: { city: 'desc' } },
          take: 7
        }),
        prisma.click.groupBy({
          by: ['device'],
          where,
          _count: { _all: true },
          orderBy: { _count: { device: 'desc' } }
        }),
        prisma.click.groupBy({
          by: ['os'],
          where,
          _count: { _all: true },
          orderBy: { _count: { os: 'desc' } },
          take: 7
        }),
        prisma.click.groupBy({
          by: ['browser'],
          where,
          _count: { _all: true },
          orderBy: { _count: { browser: 'desc' } },
          take: 7
        }),
        prisma.click.groupBy({
          by: ['referrer'],
          where,
          _count: { _all: true },
          orderBy: { _count: { referrer: 'desc' } },
          take: 7
        }),
        prisma.click.groupBy({
          by: ['linkId'],
          where,
          _count: { _all: true },
          orderBy: { _count: { linkId: 'desc' } },
          take: 7
        }),
        prisma.click.groupBy({
          by: ['utmSource'],
          where,
          _count: { _all: true },
          orderBy: { _count: { utmSource: 'desc' } },
          take: 7
        }),
        prisma.click.groupBy({
          by: ['utmMedium'],
          where,
          _count: { _all: true },
          orderBy: { _count: { utmMedium: 'desc' } },
          take: 7
        }),
        prisma.click.count({ where }),
        prisma.conversion.count({ where })
      ]);

      // Simple social referrer detection
      const socialReferrers = referrers.filter(r => 
        r.referrer?.includes('facebook') || 
        r.referrer?.includes('t.co') || 
        r.referrer?.includes('twitter') || 
        r.referrer?.includes('linkedin') || 
        r.referrer?.includes('instagram') ||
        r.referrer?.includes('youtube')
      );

      // Fetch link titles for topLinks
      const topLinksWithTitles = await Promise.all(topLinks.map(async (item) => {
        const link = await prisma.link.findUnique({ where: { id: item.linkId }, select: { title: true, slug: true } });
        return { ...item, title: link?.title || link?.slug || 'Unknown' };
      }));

      const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00';

      res.json({ 
        geos, 
        cities,
        devices, 
        oss, 
        browsers, 
        referrers,
        socialReferrers,
        utmSources,
        utmMediums,
        topLinks: topLinksWithTitles,
        totalClicks,
        conversions: {
          total: totalConversions,
          rate: conversionRate
        }
      });
    } catch (error) {
      console.error('Failed to fetch detailed analytics:', error);
      res.json({ geos: [], devices: [], oss: [], browsers: [], referrers: [] });
    }
  });

  // Analytics API Summary
  app.get('/api/analytics/summary', async (req, res) => {
    const dbConnected = !!process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));
    
    if (!dbConnected) {
      return res.json({ totalClicks: 0, uniqueVisitors: 0, dbConnected: false });
    }

    try {
      const { start, end } = req.query;
      const where: any = {};
      if (start || end) {
        where.timestamp = {};
        if (start) where.timestamp.gte = new Date(String(start));
        if (end) where.timestamp.lte = new Date(String(end));
      }

      const totalClicks = await prisma.click.count({ where });
      const uniqueVisitors = await prisma.click.groupBy({
        by: ['ip'],
        where
      }).then(res => res.length);
      
      res.json({ totalClicks, uniqueVisitors, dbConnected: true });
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
      res.json({ totalClicks: 0, uniqueVisitors: 0, dbConnected: false });
    }
  });

  // Workspace API
  app.get('/api/workspace', async (req, res) => {
    try {
      const workspace = await prisma.workspace.findFirst({
        where: { id: 'default-workspace' }
      });
      res.json(workspace);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch workspace' });
    }
  });

  app.patch('/api/workspace', async (req, res) => {
    try {
      const workspace = await prisma.workspace.update({
        where: { id: 'default-workspace' },
        data: req.body
      });
      res.json(workspace);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update workspace' });
    }
  });

  // 3. Vite Middleware for Frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Seed default domain if none exists
  const seed = async () => {
    const dbConnected = !!process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));
    if (!dbConnected) return;
    const workspaceId = 'default-workspace';
    const userId = 'default-user';

    let workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          id: workspaceId,
          name: 'Default Workspace',
          slug: 'default',
          owner: {
            create: {
              id: userId,
              email: 'admin@example.com',
              name: 'Admin',
              password: 'hashed_password'
            }
          }
        }
      });
      console.log('Default workspace and user seeded');
    }

    const domainCount = await prisma.domain.count();
    if (domainCount === 0) {
      await prisma.domain.create({
        data: {
          hostname: 's.thinksmart.com',
          workspaceId: workspaceId,
          dnsStatus: 'configured',
          sslStatus: 'active'
        }
      });
      console.log('Default domain seeded');
    }
  };
  seed().catch(console.error);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

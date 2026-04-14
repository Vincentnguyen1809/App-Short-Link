import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 100, 2000);
    }
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

redis.on('error', (err) => {
  console.warn('Redis connection error:', err.message);
});

export const getCachedLink = async (domain: string, slug: string) => {
  const key = `link:${domain}:${slug}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  return null;
};

export const setCachedLink = async (domain: string, slug: string, data: any) => {
  const key = `link:${domain}:${slug}`;
  await redis.set(key, JSON.stringify(data), 'EX', 3600); // Cache for 1 hour
};

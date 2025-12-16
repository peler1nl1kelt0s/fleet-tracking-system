import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', () => {
  console.log('Redis error');
});

export default redis;
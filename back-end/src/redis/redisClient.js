import Redis from 'ioredis';

const redis = new Redis();

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', () => {
  console.log('Redis error');
});

export default redis;

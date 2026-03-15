const Redis = require("ioredis");

const redisOptions = {
  maxRetriesPerRequest: null
};

const redisConnection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, redisOptions)
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
      ...redisOptions
    });

module.exports = redisConnection;

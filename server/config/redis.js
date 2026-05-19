// config/redis.js - Redis caching configuration
const redis = require('redis');
const logger = require('./logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

client.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

client.on('error', (err) => {
  // Silent fail - Redis is optional, don't log errors continuously
});

client.on('ready', () => {
  logger.info('✅ Redis client ready');
});

// Connect to Redis
client.connect().catch((err) => {
  logger.warn('⚠️  Cannot connect to Redis - caching disabled', { error: err.message });
  // Don't exit, continue without caching
});

// Cache helper functions
const cacheHelpers = {
  // Get from cache
  get: async (key) => {
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error('Cache GET error', { key, error: err.message });
      return null;
    }
  },

  // Set in cache
  set: async (key, value, expirySeconds = 3600) => {
    try {
      await client.setEx(key, expirySeconds, JSON.stringify(value));
    } catch (err) {
      logger.error('Cache SET error', { key, error: err.message });
    }
  },

  // Delete from cache
  delete: async (key) => {
    try {
      await client.del(key);
    } catch (err) {
      logger.error('Cache DELETE error', { key, error: err.message });
    }
  },

  // Invalidate all cache with pattern
  invalidatePattern: async (pattern) => {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (err) {
      logger.error('Cache INVALIDATE error', { pattern, error: err.message });
    }
  },

  // Check if available
  isAvailable: () => {
    return client.isOpen;
  }
};

module.exports = { client, cacheHelpers };

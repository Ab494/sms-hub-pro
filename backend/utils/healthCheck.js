import mongoose from 'mongoose';
import logger from './logger.js';

const healthCheck = async (req, res) => {
  const startTime = Date.now();

  // Check MongoDB connection
  let dbStatus = 'healthy';
  let dbResponseTime = null;

  try {
    const dbStart = Date.now();
    await mongoose.connection.db.admin().ping();
    dbResponseTime = Date.now() - dbStart;
  } catch (error) {
    dbStatus = 'unhealthy';
    logger.error(`Health check DB ping failed: ${error.message}`);
  }

  // Get uptime
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  // Get memory
  const mem = process.memoryUsage();

  const health = {
    success: true,
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: {
        status: dbStatus,
        responseTime: dbResponseTime ? `${dbResponseTime}ms` : null,
      },
    },
    memory: {
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    },
    responseTime: `${Date.now() - startTime}ms`,
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
};

export default healthCheck;

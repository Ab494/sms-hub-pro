import logger from '../utils/logger.js';

// ── Request logger ────────────────────────────────
// Logs every request with method, path, status, duration, IP
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    if (statusCode >= 500) {
      logger.error(`${method} ${originalUrl} ${statusCode} ${duration}ms - ${ip}`);
    } else if (statusCode >= 400) {
      logger.warn(`${method} ${originalUrl} ${statusCode} ${duration}ms - ${ip}`);
    } else {
      logger.info(`${method} ${originalUrl} ${statusCode} ${duration}ms - ${ip}`);
    }
  });

  next();
};

export default requestLogger;

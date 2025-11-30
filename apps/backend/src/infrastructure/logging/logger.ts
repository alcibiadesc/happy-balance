import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Centralized logger for the application
 * Uses pino for high-performance structured logging
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Base context included in all logs
  base: {
    env: process.env.NODE_ENV,
  },

  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'password', 'token', 'secret'],
    censor: '[REDACTED]',
  },
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

/**
 * HTTP request logger middleware for Express
 */
export function httpLogger() {
  return (req: { method: string; url: string; headers: Record<string, unknown> }, _res: unknown, next: () => void) => {
    logger.info({
      msg: 'HTTP Request',
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
    });
    next();
  };
}

export default logger;

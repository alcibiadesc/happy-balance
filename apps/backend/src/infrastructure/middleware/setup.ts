import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { apiLimiter } from './rateLimiter';

export function setupMiddleware(app: express.Application): void {
  // Security middleware
  app.use(helmet());

  // Rate limiting
  app.use('/api/', apiLimiter);

  // CORS configuration
  const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5177',
    'http://192.168.1.139:5173',
    'http://100.100.8.83:5173',
  ];

  const allowedOrigins = [...defaultAllowedOrigins];
  if (process.env.CORS_ORIGIN) {
    const envOrigins = process.env.CORS_ORIGIN.split(',').map((o) => o.trim());
    allowedOrigins.push(...envOrigins);
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (process.env.CORS_ORIGIN === '*') {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
          return callback(null, true);
        }

        console.warn(`CORS rejected origin: ${origin}`);
        callback(new Error('CORS policy violation'), false);
      },
      credentials: true,
    })
  );

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}

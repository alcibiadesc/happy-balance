import { User } from '../domain/entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      rateLimit?: {
        limit: number;
        remaining: number;
        reset: Date;
      };
    }
  }
}

export {};
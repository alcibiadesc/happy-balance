import { Request, Response, NextFunction } from 'express';
import { AuthenticationService } from '@domain/services/AuthenticationService';
import { UserRole } from '@domain/entities/User';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: UserRole;
  };
}

const authService = new AuthenticationService();

/**
 * Middleware to verify JWT token and attach user info to request
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header provided'
      });
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format'
      });
    }

    const result = authService.verifyAccessToken(token);

    if (result.isFailure()) {
      return res.status(401).json({
        success: false,
        error: result.getError()
      });
    }

    const payload = result.getValue();
    req.user = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required'
    });
  }

  next();
};

/**
 * Middleware to require user or admin role (can edit)
 */
export const requireEditor = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      error: 'Edit privileges required'
    });
  }

  next();
};

/**
 * Optional authentication - doesn't fail if no token, but attaches user if valid
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return next();
    }

    const result = authService.verifyAccessToken(token);

    if (result.isSuccess()) {
      const payload = result.getValue();
      req.user = {
        userId: payload.userId,
        username: payload.username,
        role: payload.role
      };
    }

    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
};
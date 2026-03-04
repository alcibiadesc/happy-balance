import { Request, Response, NextFunction, RequestHandler } from 'express';
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
export const authenticate: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header provided',
      });
      return;
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization format',
      });
      return;
    }

    const result = authService.verifyAccessToken(token);

    if (result.isFailure()) {
      res.status(401).json({
        success: false,
        error: result.getError(),
      });
      return;
    }

    const payload = result.getValue();
    authReq.user = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Middleware to require admin role
 */
export const requireAdmin: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (authReq.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin privileges required',
    });
    return;
  }

  next();
};

/**
 * Middleware to require user or admin role (can edit)
 */
export const requireEditor: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (authReq.user.role !== 'admin' && authReq.user.role !== 'user') {
    res.status(403).json({
      success: false,
      error: 'Edit privileges required',
    });
    return;
  }

  next();
};

/**
 * Optional authentication - doesn't fail if no token, but attaches user if valid
 */
export const optionalAuth: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      next();
      return;
    }

    const result = authService.verifyAccessToken(token);

    if (result.isSuccess()) {
      const payload = result.getValue();
      authReq.user = {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      };
    }

    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
};

import { Router } from 'express';
import { AuthController } from '@infrastructure/controllers/AuthController';
import { authenticate } from '@infrastructure/middleware/auth';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: User login
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *                     user:
   *                       type: object
   */
  router.post('/login', (req, res) => authController.login(req, res));

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Refresh access token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   */
  router.post('/refresh', (req, res) => authController.refresh(req, res));

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: User logout
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   */
  router.post('/logout', authenticate, (req, res) => authController.logout(req, res));

  /**
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     tags: [Auth]
   *     summary: Change user password
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password changed successfully
   */
  router.post('/change-password', authenticate, (req, res) => authController.changePassword(req, res));

  /**
   * @swagger
   * /api/auth/reset-password-change:
   *   post:
   *     tags: [Auth]
   *     summary: Change password after reset (for users with mustChangePassword flag)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               userId:
   *                 type: string
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password changed successfully and user logged in
   */
  router.post('/reset-password-change', (req, res) => authController.resetPasswordChange(req, res));

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Get current user info
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user info
   */
  router.get('/me', authenticate, (req, res) => authController.me(req, res));

  return router;
}
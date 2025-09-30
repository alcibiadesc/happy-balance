import { Router } from 'express';
import { UserManagementController } from '@infrastructure/controllers/UserManagementController';
import { authenticate, requireAdmin, AuthRequest } from '@infrastructure/middleware/auth';

export function createUserManagementRoutes(controller: UserManagementController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authenticate);
  router.use(requireAdmin);

  /**
   * @swagger
   * /api/admin/users:
   *   get:
   *     tags: [Admin]
   *     summary: List all users (Admin only)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of users
   */
  router.get('/', (req, res) => controller.listUsers(req as AuthRequest, res));

  /**
   * @swagger
   * /api/admin/users:
   *   post:
   *     tags: [Admin]
   *     summary: Create new user (Admin only)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *             properties:
   *               username:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [admin, user, viewer]
   *                 default: user
   *               tempPassword:
   *                 type: string
   *                 description: Optional temporary password (generated if not provided)
   *     responses:
   *       201:
   *         description: User created successfully
   */
  router.post('/', (req, res) => controller.createUser(req as AuthRequest, res));

  /**
   * @swagger
   * /api/admin/users/{id}:
   *   put:
   *     tags: [Admin]
   *     summary: Update user (Admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               role:
   *                 type: string
   *                 enum: [admin, user, viewer]
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: User updated successfully
   */
  router.put('/:id', (req, res) => controller.updateUser(req as AuthRequest, res));

  /**
   * @swagger
   * /api/admin/users/{id}:
   *   delete:
   *     tags: [Admin]
   *     summary: Delete user (Admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User deleted successfully
   */
  router.delete('/:id', (req, res) => controller.deleteUser(req as AuthRequest, res));

  /**
   * @swagger
   * /api/admin/users/reset-password:
   *   post:
   *     tags: [Admin]
   *     summary: Reset user password (Admin only)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *               tempPassword:
   *                 type: string
   *                 description: Optional new password (generated if not provided)
   *     responses:
   *       200:
   *         description: Password reset successfully
   */
  router.post('/reset-password', (req, res) => controller.resetPassword(req as AuthRequest, res));

  return router;
}
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const router = Router();

interface CreateCategoryDto {
  name: string;
  type: 'income' | 'essential' | 'discretionary' | 'investment';
  color?: string;
  icon?: string;
  parentId?: string;
}

interface UpdateCategoryDto {
  name?: string;
  type?: 'income' | 'essential' | 'discretionary' | 'investment';
  color?: string;
  icon?: string;
  parentId?: string | null;
  isActive?: boolean;
}

interface CategoryLearningDto {
  transactionId: string;
  categoryId: string;
  applyToAll?: boolean;
}

export class CategoryController {
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    router.get('/categories', this.getCategories.bind(this));
    router.get('/categories/:id', this.getCategoryById.bind(this));
    router.post('/categories', this.createCategory.bind(this));
    router.put('/categories/:id', this.updateCategory.bind(this));
    router.delete('/categories/:id', this.deleteCategory.bind(this));
    router.post('/categories/learn', this.learnFromCorrection.bind(this));
    router.post('/categories/seed', this.seedDefaultCategories.bind(this));
  }

  async getCategories(req: Request, res: Response) {
    try {
      const { type, isActive } = req.query;

      const where: any = {};
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const categories = await prisma.category.findMany({
        where,
        include: {
          _count: {
            select: { transactions: true }
          },
          parent: true,
          children: true
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ]
      });

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories'
      });
    }
  }

  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { transactions: true }
          },
          parent: true,
          children: true
        }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category'
      });
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const { name, type, color, icon, parentId }: CreateCategoryDto = req.body;

      if (!name || !type) {
        return res.status(400).json({
          success: false,
          error: 'Name and type are required'
        });
      }

      const category = await prisma.category.create({
        data: {
          id: uuidv4(),
          name,
          type,
          color: color || this.getDefaultColorForType(type),
          icon: icon || this.getDefaultIconForType(type),
          parentId,
          isActive: true
        },
        include: {
          parent: true,
          children: true
        }
      });

      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error: any) {
      console.error('Error creating category:', error);

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: 'A category with this name and type already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create category'
      });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates: UpdateCategoryDto = req.body;

      const category = await prisma.category.update({
        where: { id },
        data: updates,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { transactions: true }
          }
        }
      });

      res.json({
        success: true,
        data: category
      });
    } catch (error: any) {
      console.error('Error updating category:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: 'A category with this name and type already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update category'
      });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reassignTo } = req.query;

      // Check if category has transactions
      const transactionCount = await prisma.transaction.count({
        where: { categoryId: id }
      });

      if (transactionCount > 0 && !reassignTo) {
        return res.status(400).json({
          success: false,
          error: 'Category has transactions. Provide reassignTo parameter to reassign them.',
          data: { transactionCount }
        });
      }

      // Reassign transactions if needed
      if (transactionCount > 0 && reassignTo) {
        await prisma.transaction.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignTo as string }
        });
      }

      // Delete the category
      await prisma.category.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete category'
      });
    }
  }

  async learnFromCorrection(req: Request, res: Response) {
    try {
      const { transactionId, categoryId, applyToAll }: CategoryLearningDto = req.body;

      if (!transactionId || !categoryId) {
        return res.status(400).json({
          success: false,
          error: 'Transaction ID and Category ID are required'
        });
      }

      // Get the transaction details
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      // Update the specific transaction
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { categoryId }
      });

      let updatedCount = 1;

      // If applyToAll is true, update all transactions with the same merchant
      if (applyToAll) {
        const result = await prisma.transaction.updateMany({
          where: {
            merchant: transaction.merchant,
            id: { not: transactionId }
          },
          data: { categoryId }
        });
        updatedCount += result.count;
      }

      // Store the learning pattern for future imports
      // This could be enhanced with a separate CategoryRule table
      await prisma.appSettings.upsert({
        where: { key: `merchant_category_${transaction.merchant}` },
        update: {
          value: { categoryId, merchant: transaction.merchant }
        },
        create: {
          id: uuidv4(),
          key: `merchant_category_${transaction.merchant}`,
          value: { categoryId, merchant: transaction.merchant },
          description: `Learned category for merchant ${transaction.merchant}`
        }
      });

      res.json({
        success: true,
        message: `Category updated for ${updatedCount} transaction(s)`,
        data: {
          updatedCount,
          merchant: transaction.merchant,
          categoryId
        }
      });
    } catch (error) {
      console.error('Error learning from correction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to learn from correction'
      });
    }
  }

  async seedDefaultCategories(req: Request, res: Response) {
    try {
      const defaultCategories = [
        // Essential expenses
        { id: uuidv4(), name: 'Housing', type: 'essential', color: '#023c46', icon: '🏠' },
        { id: uuidv4(), name: 'Food & Groceries', type: 'essential', color: '#f5796c', icon: '🍽️' },
        { id: uuidv4(), name: 'Transport', type: 'essential', color: '#7abaa5', icon: '🚇' },
        { id: uuidv4(), name: 'Utilities', type: 'essential', color: '#023c46', icon: '⚡' },
        { id: uuidv4(), name: 'Healthcare', type: 'essential', color: '#f5796c', icon: '🏥' },
        { id: uuidv4(), name: 'Insurance', type: 'essential', color: '#023c46', icon: '🛡️' },

        // Discretionary expenses
        { id: uuidv4(), name: 'Entertainment', type: 'discretionary', color: '#fecd2c', icon: '🎬' },
        { id: uuidv4(), name: 'Dining Out', type: 'discretionary', color: '#fecd2c', icon: '🍕' },
        { id: uuidv4(), name: 'Shopping', type: 'discretionary', color: '#fecd2c', icon: '🛍️' },
        { id: uuidv4(), name: 'Travel', type: 'discretionary', color: '#fecd2c', icon: '✈️' },
        { id: uuidv4(), name: 'Hobbies', type: 'discretionary', color: '#fecd2c', icon: '🎨' },
        { id: uuidv4(), name: 'Subscriptions', type: 'discretionary', color: '#fecd2c', icon: '📱' },

        // Investment
        { id: uuidv4(), name: 'Stocks', type: 'investment', color: '#023c46', icon: '📈' },
        { id: uuidv4(), name: 'Real Estate', type: 'investment', color: '#023c46', icon: '🏢' },
        { id: uuidv4(), name: 'Crypto', type: 'investment', color: '#023c46', icon: '₿' },
        { id: uuidv4(), name: 'Savings', type: 'investment', color: '#023c46', icon: '🏦' },
        { id: uuidv4(), name: 'Education', type: 'investment', color: '#023c46', icon: '📚' },

        // Income
        { id: uuidv4(), name: 'Salary', type: 'income', color: '#7abaa5', icon: '💰' },
        { id: uuidv4(), name: 'Freelance', type: 'income', color: '#7abaa5', icon: '💼' },
        { id: uuidv4(), name: 'Investment Returns', type: 'income', color: '#7abaa5', icon: '📊' },
        { id: uuidv4(), name: 'Other Income', type: 'income', color: '#7abaa5', icon: '💵' }
      ];

      const createdCategories = [];
      for (const category of defaultCategories) {
        try {
          const created = await prisma.category.create({
            data: {
              ...category,
              isActive: true
            }
          });
          createdCategories.push(created);
        } catch (error: any) {
          // Skip if category already exists
          if (error.code !== 'P2002') {
            throw error;
          }
        }
      }

      res.json({
        success: true,
        message: `Created ${createdCategories.length} default categories`,
        data: createdCategories
      });
    } catch (error) {
      console.error('Error seeding categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to seed default categories'
      });
    }
  }

  private getDefaultColorForType(type: string): string {
    const colors = {
      income: '#7abaa5',
      essential: '#023c46',
      discretionary: '#fecd2c',
      investment: '#023c46'
    };
    return colors[type as keyof typeof colors] || '#3B82F6';
  }

  private getDefaultIconForType(type: string): string {
    const icons = {
      income: '💰',
      essential: '🏠',
      discretionary: '🎬',
      investment: '📈'
    };
    return icons[type as keyof typeof icons] || '💵';
  }

  getRouter() {
    return router;
  }
}

export default CategoryController;
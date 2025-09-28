import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Happy Balance API',
      version: '1.0.0',
      description: 'Complete API documentation for Happy Balance application',
      contact: {
        name: 'API Support',
        email: 'support@happy-balance.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3005/api',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3006/api',
        description: 'Alternative development server'
      }
    ],
    components: {
      schemas: {
        // Transaction Schemas
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            date: { type: 'string', format: 'date' },
            merchant: { type: 'string' },
            type: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE', 'INVESTMENT', 'DEBT_PAYMENT']
            },
            description: { type: 'string' },
            categoryId: { type: 'string', nullable: true },
            hidden: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Category Schemas
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            color: { type: 'string' },
            icon: { type: 'string' },
            isActive: { type: 'boolean' },
            parentId: { type: 'string', nullable: true }
          }
        },

        // Dashboard Schemas
        DashboardMetrics: {
          type: 'object',
          properties: {
            income: { type: 'number' },
            expenses: { type: 'number' },
            investments: { type: 'number' },
            debtPayments: { type: 'number' },
            balance: { type: 'number' },
            savingsRate: { type: 'number' },
            currency: { type: 'string' }
          }
        },

        DashboardResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            period: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                year: { type: 'number' },
                month: { type: 'number' },
                startDate: { type: 'string' },
                endDate: { type: 'string' }
              }
            },
            data: {
              type: 'object',
              properties: {
                summary: { $ref: '#/components/schemas/DashboardMetrics' },
                distribution: {
                  type: 'object',
                  properties: {
                    essential: { type: 'number' },
                    discretionary: { type: 'number' },
                    uncategorized: { type: 'number' }
                  }
                },
                categories: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      amount: { type: 'number' },
                      percentage: { type: 'number' },
                      transactionCount: { type: 'number' }
                    }
                  }
                },
                trends: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      month: { type: 'string' },
                      income: { type: 'number' },
                      expenses: { type: 'number' },
                      balance: { type: 'number' },
                      investments: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        },

        SavingsMetrics: {
          type: 'object',
          properties: {
            totalSavings: { type: 'number' },
            savingsRate: { type: 'number' },
            expenseRatio: { type: 'number' },
            dailyAverageExpense: { type: 'number' },
            projectedMonthlySavings: { type: 'number' },
            projectedYearlySavings: { type: 'number' }
          }
        },

        AvailablePeriod: {
          type: 'object',
          properties: {
            year: { type: 'number' },
            month: { type: 'number' },
            label: { type: 'string' },
            hasData: { type: 'boolean' },
            transactionCount: { type: 'number' },
            totalAmount: { type: 'number' }
          }
        },

        // Error Response
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/infrastructure/routes/*.ts', './src/infrastructure/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
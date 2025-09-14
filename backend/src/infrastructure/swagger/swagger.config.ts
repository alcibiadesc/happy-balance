import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Happy Balance API',
    version: '1.0.0',
    description: 'API documentation for Happy Balance - Personal Finance Management System',
    contact: {
      name: 'Happy Balance Team',
      email: 'support@happybalance.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'http://192.168.1.139:3000/api',
      description: 'Local network server'
    },
    {
      url: 'http://100.100.8.83:3000/api',
      description: 'Alternative local server'
    }
  ],
  components: {
    schemas: {
      Transaction: {
        type: 'object',
        required: ['id', 'amount', 'currency', 'date', 'merchant', 'type'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the transaction'
          },
          amount: {
            type: 'number',
            format: 'float',
            minimum: 0,
            description: 'Transaction amount'
          },
          currency: {
            type: 'string',
            minLength: 3,
            maxLength: 3,
            description: 'Currency code (ISO 4217)',
            example: 'EUR'
          },
          date: {
            type: 'string',
            format: 'date',
            description: 'Transaction date (YYYY-MM-DD)',
            example: '2024-01-15'
          },
          merchant: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Merchant or payee name'
          },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE', 'INVESTMENT'],
            description: 'Transaction type'
          },
          description: {
            type: 'string',
            maxLength: 200,
            description: 'Optional transaction description'
          },
          categoryId: {
            type: 'string',
            format: 'uuid',
            description: 'Category identifier'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the transaction was created'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the transaction was last updated'
          }
        }
      },
      CreateTransactionRequest: {
        type: 'object',
        required: ['amount', 'currency', 'date', 'merchant', 'type'],
        properties: {
          amount: {
            type: 'number',
            format: 'float',
            minimum: 0,
            description: 'Transaction amount'
          },
          currency: {
            type: 'string',
            minLength: 3,
            maxLength: 3,
            description: 'Currency code (ISO 4217)',
            example: 'EUR'
          },
          date: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Transaction date (YYYY-MM-DD)',
            example: '2024-01-15'
          },
          merchant: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Merchant or payee name'
          },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE', 'INVESTMENT'],
            description: 'Transaction type'
          },
          description: {
            type: 'string',
            maxLength: 200,
            description: 'Optional transaction description'
          },
          categoryId: {
            type: 'string',
            format: 'uuid',
            description: 'Optional category identifier'
          }
        }
      },
      UpdateTransactionRequest: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            format: 'float',
            minimum: 0,
            description: 'Transaction amount'
          },
          currency: {
            type: 'string',
            minLength: 3,
            maxLength: 3,
            description: 'Currency code (ISO 4217)'
          },
          date: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Transaction date (YYYY-MM-DD)'
          },
          merchant: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Merchant or payee name'
          },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE', 'INVESTMENT'],
            description: 'Transaction type'
          },
          description: {
            type: 'string',
            maxLength: 200,
            description: 'Optional transaction description'
          },
          categoryId: {
            type: 'string',
            format: 'uuid',
            description: 'Optional category identifier'
          }
        }
      },
      TransactionFilters: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Filter transactions from this date'
          },
          endDate: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Filter transactions up to this date'
          },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE', 'INVESTMENT'],
            description: 'Filter by transaction type'
          },
          categoryId: {
            type: 'string',
            format: 'uuid',
            description: 'Filter by category'
          },
          merchantName: {
            type: 'string',
            description: 'Filter by merchant name (partial match)'
          },
          minAmount: {
            type: 'number',
            description: 'Minimum transaction amount'
          },
          maxAmount: {
            type: 'number',
            description: 'Maximum transaction amount'
          },
          currency: {
            type: 'string',
            minLength: 3,
            maxLength: 3,
            description: 'Filter by currency code'
          },
          page: {
            type: 'integer',
            minimum: 1,
            default: 1,
            description: 'Page number for pagination'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: 'Number of items per page'
          }
        }
      },
      DashboardData: {
        type: 'object',
        properties: {
          summary: {
            type: 'object',
            properties: {
              totalIncome: {
                type: 'number',
                description: 'Total income for the period'
              },
              totalExpenses: {
                type: 'number',
                description: 'Total expenses for the period'
              },
              netBalance: {
                type: 'number',
                description: 'Net balance (income - expenses)'
              },
              savingsRate: {
                type: 'number',
                description: 'Savings rate percentage'
              },
              currency: {
                type: 'string',
                description: 'Currency for all amounts'
              }
            }
          },
          categoryBreakdown: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Category name'
                },
                amount: {
                  type: 'number',
                  description: 'Total amount for this category'
                },
                percentage: {
                  type: 'number',
                  description: 'Percentage of total expenses'
                },
                count: {
                  type: 'integer',
                  description: 'Number of transactions'
                }
              }
            }
          },
          monthlyTrends: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                month: {
                  type: 'string',
                  description: 'Month (YYYY-MM)'
                },
                income: {
                  type: 'number',
                  description: 'Total income for the month'
                },
                expenses: {
                  type: 'number',
                  description: 'Total expenses for the month'
                },
                balance: {
                  type: 'number',
                  description: 'Net balance for the month'
                }
              }
            }
          },
          recentTransactions: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Transaction'
            }
          }
        }
      },
      Statistics: {
        type: 'object',
        properties: {
          totalTransactions: {
            type: 'integer',
            description: 'Total number of transactions'
          },
          totalIncome: {
            type: 'number',
            description: 'Sum of all income transactions'
          },
          totalExpenses: {
            type: 'number',
            description: 'Sum of all expense transactions'
          },
          averageTransaction: {
            type: 'number',
            description: 'Average transaction amount'
          },
          largestTransaction: {
            type: 'object',
            properties: {
              amount: {
                type: 'number'
              },
              merchant: {
                type: 'string'
              },
              date: {
                type: 'string',
                format: 'date'
              }
            }
          },
          categoriesCount: {
            type: 'integer',
            description: 'Number of unique categories used'
          }
        }
      },
      UserPreferences: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'User identifier'
          },
          theme: {
            type: 'string',
            enum: ['light', 'dark', 'auto'],
            description: 'UI theme preference'
          },
          currency: {
            type: 'string',
            description: 'Preferred currency'
          },
          language: {
            type: 'string',
            description: 'Preferred language'
          },
          dateFormat: {
            type: 'string',
            description: 'Preferred date format'
          },
          notifications: {
            type: 'object',
            properties: {
              email: {
                type: 'boolean',
                description: 'Email notifications enabled'
              },
              push: {
                type: 'boolean',
                description: 'Push notifications enabled'
              },
              weekly_summary: {
                type: 'boolean',
                description: 'Weekly summary notifications'
              },
              budget_alerts: {
                type: 'boolean',
                description: 'Budget alert notifications'
              }
            }
          },
          privacy: {
            type: 'object',
            properties: {
              analytics: {
                type: 'boolean',
                description: 'Analytics tracking enabled'
              },
              data_sharing: {
                type: 'boolean',
                description: 'Data sharing enabled'
              }
            }
          }
        }
      },
      ImportPreview: {
        type: 'object',
        properties: {
          headers: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'CSV column headers'
          },
          rows: {
            type: 'array',
            items: {
              type: 'object'
            },
            description: 'Preview of first few rows'
          },
          totalRows: {
            type: 'integer',
            description: 'Total number of rows in file'
          },
          suggestedMappings: {
            type: 'object',
            description: 'Suggested column mappings'
          }
        }
      },
      ImportValidation: {
        type: 'object',
        properties: {
          valid: {
            type: 'boolean',
            description: 'Whether the file is valid for import'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                row: {
                  type: 'integer',
                  description: 'Row number with error'
                },
                column: {
                  type: 'string',
                  description: 'Column with error'
                },
                message: {
                  type: 'string',
                  description: 'Error message'
                }
              }
            }
          },
          warnings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                row: {
                  type: 'integer'
                },
                column: {
                  type: 'string'
                },
                message: {
                  type: 'string'
                }
              }
            }
          },
          summary: {
            type: 'object',
            properties: {
              totalRows: {
                type: 'integer'
              },
              validRows: {
                type: 'integer'
              },
              invalidRows: {
                type: 'integer'
              },
              duplicates: {
                type: 'integer'
              }
            }
          }
        }
      },
      DuplicateCheck: {
        type: 'object',
        properties: {
          hashes: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Transaction hashes to check for duplicates'
          }
        }
      },
      DuplicateCheckResult: {
        type: 'object',
        properties: {
          duplicates: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Hashes that are duplicates'
          },
          unique: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Hashes that are unique'
          },
          totalChecked: {
            type: 'integer'
          },
          duplicateCount: {
            type: 'integer'
          },
          uniqueCount: {
            type: 'integer'
          }
        }
      },
      ImportHistory: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          fileName: {
            type: 'string'
          },
          importDate: {
            type: 'string',
            format: 'date-time'
          },
          totalRows: {
            type: 'integer'
          },
          importedRows: {
            type: 'integer'
          },
          skippedRows: {
            type: 'integer'
          },
          status: {
            type: 'string',
            enum: ['SUCCESS', 'PARTIAL', 'FAILED']
          },
          errors: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          },
          code: {
            type: 'string',
            description: 'Error code'
          }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            default: true
          },
          message: {
            type: 'string'
          },
          data: {
            type: 'object'
          }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Bad request - Invalid input data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Transactions',
      description: 'Transaction management operations'
    },
    {
      name: 'Import',
      description: 'Data import operations for CSV/Excel files'
    },
    {
      name: 'User Preferences',
      description: 'User preferences and settings management'
    },
    {
      name: 'Health',
      description: 'API health and status checks'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, './api-docs.ts')
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
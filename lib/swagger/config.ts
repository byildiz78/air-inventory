import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Air Inventory API',
      version: '1.0.0',
      description: 'Restaurant inventory management system API - Complete solution for managing materials, recipes, invoices, and current accounts.',
      contact: {
        name: 'Air Inventory Support',
        email: 'support@airinventory.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://yourdomain.com/api' 
          : 'http://localhost:3000/api',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          },
          required: ['success', 'error']
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            }
          },
          required: ['success']
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              example: 10,
              description: 'Number of items per page'
            },
            totalCount: {
              type: 'integer',
              example: 100,
              description: 'Total number of items'
            },
            totalPages: {
              type: 'integer',
              example: 10,
              description: 'Total number of pages'
            },
            hasNextPage: {
              type: 'boolean',
              example: true,
              description: 'Whether there is a next page'
            },
            hasPrevPage: {
              type: 'boolean',
              example: false,
              description: 'Whether there is a previous page'
            }
          },
          required: ['page', 'limit', 'totalCount', 'totalPages', 'hasNextPage', 'hasPrevPage']
        },
        
        // Invoice schemas
        Invoice: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
              description: 'Unique invoice identifier'
            },
            invoiceNumber: {
              type: 'string',
              example: 'INV-2024-001',
              description: 'Human-readable invoice number'
            },
            type: {
              type: 'string',
              enum: ['PURCHASE', 'SALE', 'RETURN'],
              example: 'PURCHASE',
              description: 'Type of invoice'
            },
            supplierId: {
              type: 'string',
              nullable: true,
              example: 'clx1234567890',
              description: 'Supplier ID (legacy, nullable)'
            },
            supplierName: {
              type: 'string',
              example: 'ABC Tedarik Ltd.',
              description: 'Name of the supplier'
            },
            currentAccountId: {
              type: 'string',
              nullable: true,
              example: 'clx1234567890',
              description: 'Current account ID'
            },
            currentAccountName: {
              type: 'string',
              example: 'ABC Tedarik Ltd.',
              description: 'Name of the current account'
            },
            date: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
              description: 'Invoice date'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2024-02-15T10:30:00Z',
              description: 'Due date for payment'
            },
            subtotalAmount: {
              type: 'number',
              format: 'float',
              example: 1000.00,
              description: 'Subtotal amount (excluding tax)'
            },
            totalDiscountAmount: {
              type: 'number',
              format: 'float',
              example: 100.00,
              description: 'Total discount amount'
            },
            totalTaxAmount: {
              type: 'number',
              format: 'float',
              example: 180.00,
              description: 'Total tax amount'
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              example: 1080.00,
              description: 'Total amount (including tax)'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'PAID', 'CANCELLED'],
              example: 'PENDING',
              description: 'Invoice status'
            },
            itemCount: {
              type: 'integer',
              example: 5,
              description: 'Number of items in the invoice'
            },
            userName: {
              type: 'string',
              example: 'John Doe',
              description: 'Name of the user who created the invoice'
            }
          },
          required: ['id', 'invoiceNumber', 'type', 'supplierName', 'date', 'subtotalAmount', 'totalTaxAmount', 'totalAmount', 'status', 'itemCount']
        },
        
        InvoiceItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
              description: 'Unique item identifier'
            },
            materialId: {
              type: 'string',
              example: 'clx1234567890',
              description: 'Material identifier'
            },
            materialName: {
              type: 'string',
              example: 'Domates',
              description: 'Name of the material'
            },
            unitId: {
              type: 'string',
              example: 'clx1234567890',
              description: 'Unit identifier'
            },
            unitName: {
              type: 'string',
              example: 'Kilogram',
              description: 'Name of the unit'
            },
            warehouseId: {
              type: 'string',
              example: 'clx1234567890',
              description: 'Warehouse identifier'
            },
            warehouseName: {
              type: 'string',
              example: 'Ana Depo',
              description: 'Name of the warehouse'
            },
            quantity: {
              type: 'number',
              format: 'float',
              example: 10.5,
              description: 'Quantity of the item'
            },
            unitPrice: {
              type: 'number',
              format: 'float',
              example: 15.50,
              description: 'Unit price (excluding tax)'
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              example: 180.25,
              description: 'Total amount for this item (including tax)'
            }
          },
          required: ['id', 'materialId', 'materialName', 'unitId', 'unitName', 'warehouseId', 'warehouseName', 'quantity', 'unitPrice', 'totalAmount']
        },
        
        // Material schemas
        Material: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
              description: 'Unique material identifier'
            },
            name: {
              type: 'string',
              example: 'Domates',
              description: 'Name of the material'
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Taze domates',
              description: 'Description of the material'
            },
            categoryId: {
              type: 'string',
              example: 'clx1234567890',
              description: 'Category identifier'
            },
            currentStock: {
              type: 'number',
              format: 'float',
              example: 150.5,
              description: 'Current stock level'
            },
            minStockLevel: {
              type: 'number',
              format: 'float',
              example: 20.0,
              description: 'Minimum stock level'
            },
            maxStockLevel: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 500.0,
              description: 'Maximum stock level'
            },
            lastPurchasePrice: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 15.50,
              description: 'Last purchase price'
            },
            averageCost: {
              type: 'number',
              format: 'float',
              example: 14.25,
              description: 'Average cost'
            },
            isActive: {
              type: 'boolean',
              example: true,
              description: 'Whether the material is active'
            }
          },
          required: ['id', 'name', 'categoryId', 'currentStock', 'minStockLevel', 'averageCost', 'isActive']
        },
        
        // Recipe schemas
        Recipe: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
              description: 'Unique recipe identifier'
            },
            name: {
              type: 'string',
              example: 'Domates Çorbası',
              description: 'Name of the recipe'
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Geleneksel domates çorbası',
              description: 'Description of the recipe'
            },
            category: {
              type: 'string',
              nullable: true,
              example: 'Çorbalar',
              description: 'Recipe category'
            },
            servingSize: {
              type: 'integer',
              example: 4,
              description: 'Number of servings'
            },
            preparationTime: {
              type: 'integer',
              nullable: true,
              example: 30,
              description: 'Preparation time in minutes'
            },
            totalCost: {
              type: 'number',
              format: 'float',
              example: 25.50,
              description: 'Total cost of the recipe'
            },
            costPerServing: {
              type: 'number',
              format: 'float',
              example: 6.38,
              description: 'Cost per serving'
            },
            profitMargin: {
              type: 'number',
              format: 'float',
              example: 35.5,
              description: 'Profit margin percentage'
            },
            profitAmount: {
              type: 'number',
              format: 'float',
              example: 8.62,
              description: 'Profit amount per serving'
            },
            isActive: {
              type: 'boolean',
              example: true,
              description: 'Whether the recipe is active'
            }
          },
          required: ['id', 'name', 'servingSize', 'totalCost', 'costPerServing', 'isActive']
        },
        
        // Current Account schemas
        CurrentAccount: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
              description: 'Unique current account identifier'
            },
            code: {
              type: 'string',
              example: 'CAR001',
              description: 'Current account code'
            },
            name: {
              type: 'string',
              example: 'ABC Tedarik Ltd.',
              description: 'Name of the current account'
            },
            type: {
              type: 'string',
              enum: ['SUPPLIER', 'CUSTOMER', 'BOTH'],
              example: 'SUPPLIER',
              description: 'Type of current account'
            },
            openingBalance: {
              type: 'number',
              format: 'float',
              example: 0.00,
              description: 'Opening balance'
            },
            currentBalance: {
              type: 'number',
              format: 'float',
              example: 1250.75,
              description: 'Current balance (negative = debt, positive = credit)'
            },
            creditLimit: {
              type: 'number',
              format: 'float',
              example: 10000.00,
              description: 'Credit limit'
            },
            contactName: {
              type: 'string',
              nullable: true,
              example: 'Ahmet Yılmaz',
              description: 'Contact person name'
            },
            phone: {
              type: 'string',
              nullable: true,
              example: '+90 555 123 4567',
              description: 'Phone number'
            },
            email: {
              type: 'string',
              nullable: true,
              example: 'info@abctedarik.com',
              description: 'Email address'
            },
            address: {
              type: 'string',
              nullable: true,
              example: 'Atatürk Cad. No:123 Şişli/İstanbul',
              description: 'Address'
            },
            taxNumber: {
              type: 'string',
              nullable: true,
              example: '1234567890',
              description: 'Tax number'
            },
            isActive: {
              type: 'boolean',
              example: true,
              description: 'Whether the current account is active'
            }
          },
          required: ['id', 'code', 'name', 'type', 'openingBalance', 'currentBalance', 'creditLimit', 'isActive']
        },

        // Sales Item schemas
        SalesItemCategory: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890' },
            name: { type: 'string', example: 'Ana Yemek' },
            description: { type: 'string', example: 'Et, tavuk ve sebze ana yemekleri' },
            color: { type: 'string', example: '#3B82F6' },
            sortOrder: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
          },
          required: ['id', 'name', 'isActive']
        },

        SalesItemGroup: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890' },
            name: { type: 'string', example: 'Et Yemekleri' },
            categoryId: { type: 'string', example: 'clx1234567890' },
            category: { type: 'string', example: 'Ana Yemek' },
            description: { type: 'string', example: 'Çeşitli et yemekleri' },
            color: { type: 'string', example: '#6B7280' },
            sortOrder: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
          },
          required: ['id', 'name', 'categoryId', 'isActive']
        },

        SalesItem: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890' },
            name: { type: 'string', example: 'Kuşbaşılı Pilav' },
            menuCode: { type: 'string', example: 'M001' },
            description: { type: 'string', example: 'Geleneksel kuşbaşılı pilav' },
            basePrice: { type: 'number', format: 'float', example: 25.50 },
            taxPercent: { type: 'number', format: 'float', example: 10.0 },
            categoryId: { type: 'string', example: 'clx1234567890' },
            category: { type: 'string', example: 'Ana Yemek' },
            groupId: { type: 'string', example: 'clx1234567890' },
            sortOrder: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true },
            isAvailable: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
          },
          required: ['id', 'name', 'categoryId', 'isActive', 'isAvailable']
        },

        Sale: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890' },
            date: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
            itemName: { type: 'string', example: 'Kuşbaşılı Pilav' },
            salesItemId: { type: 'string', example: 'clx1234567890' },
            quantity: { type: 'number', format: 'float', example: 2.5 },
            unitPrice: { type: 'number', format: 'float', example: 25.50 },
            totalAmount: { type: 'number', format: 'float', example: 63.75 },
            customerName: { type: 'string', example: 'Ahmet Yılmaz' },
            notes: { type: 'string', example: 'Ekstra baharat istedi' },
            userId: { type: 'string', example: 'clx1234567890' },
            userName: { type: 'string', example: 'Mehmet Özkan' },
            recipeId: { type: 'string', example: 'clx1234567890' },
            recipeName: { type: 'string', example: 'Kuşbaşılı Pilav Tarifi' },
            totalCost: { type: 'number', format: 'float', example: 18.75 },
            grossProfit: { type: 'number', format: 'float', example: 45.00 },
            profitMargin: { type: 'number', format: 'float', example: 70.59 },
            createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
          },
          required: ['id', 'date', 'itemName', 'salesItemId', 'quantity', 'unitPrice', 'totalAmount', 'userId']
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Invoices',
        description: 'Invoice management operations'
      },
      {
        name: 'Materials',
        description: 'Material and inventory management'
      },
      {
        name: 'Recipes',
        description: 'Recipe and cost analysis operations'
      },
      {
        name: 'Current Accounts',
        description: 'Current account management'
      },
      {
        name: 'Sales Item Categories',
        description: 'Sales item category management'
      },
      {
        name: 'Sales Item Groups',
        description: 'Sales item group management'
      },
      {
        name: 'Sales Items',
        description: 'Sales item management'
      },
      {
        name: 'Sales',
        description: 'Sales transaction management'
      },
      {
        name: 'Authentication',
        description: 'JWT-based user authentication and authorization'
      }
    ]
  },
  apis: [
    './app/api/**/*.ts',
    './lib/swagger/docs/*.yaml'
  ], // Path to the API files
};

export const swaggerSpec = swaggerJSDoc(options);
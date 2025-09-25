/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Dashboard metrics and analytics endpoints
 *   - name: Transactions
 *     description: Transaction management endpoints
 *   - name: Categories
 *     description: Category management endpoints
 *   - name: Metrics
 *     description: Legacy metrics endpoints
 */

/**
 * @swagger
 * /dashboard/month/{year}/{month}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly dashboard metrics
 *     description: Returns comprehensive dashboard data for a specific month
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2030
 *         description: Year (e.g., 2025)
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *     responses:
 *       200:
 *         description: Monthly dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /dashboard/year/{year}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get yearly dashboard metrics
 *     description: Returns dashboard data for an entire year
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2030
 *         description: Year (e.g., 2025)
 *     responses:
 *       200:
 *         description: Yearly dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 */

/**
 * @swagger
 * /dashboard/current:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get current period metrics
 *     description: Returns dashboard data for the current period
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Period type
 *     responses:
 *       200:
 *         description: Current period dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 */

/**
 * @swagger
 * /dashboard/available-periods:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get periods with available data
 *     description: Returns a list of periods that have transaction data
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 24
 *         description: Maximum number of periods to return
 *     responses:
 *       200:
 *         description: List of available periods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AvailablePeriod'
 */

/**
 * @swagger
 * /dashboard/comparison/{year}/{month}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get month with comparison data
 *     description: Returns metrics for a month with comparison to previous month
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Monthly data with comparison
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 current:
 *                   $ref: '#/components/schemas/DashboardMetrics'
 *                 previous:
 *                   $ref: '#/components/schemas/DashboardMetrics'
 *                 comparison:
 *                   type: object
 *                   properties:
 *                     percentageChange:
 *                       type: number
 *                     changes:
 *                       type: object
 */

/**
 * @swagger
 * /dashboard/savings/{year}/{month}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get savings metrics
 *     description: Returns detailed savings and expense metrics for a month
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Savings metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SavingsMetrics'
 */

/**
 * @swagger
 * /dashboard/categories/{year}/{month}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category breakdown
 *     description: Returns expense distribution by categories
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Category breakdown
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                     topCategories:
 *                       type: array
 *                       items:
 *                         type: object
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: List transactions
 *     description: Get filtered and paginated transactions
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, INVESTMENT, DEBT_PAYMENT]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *   post:
 *     tags: [Transactions]
 *     summary: Create transaction
 *     description: Create a new transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, date, type, merchant]
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: EUR
 *               date:
 *                 type: string
 *                 format: date
 *               merchant:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE, INVESTMENT, DEBT_PAYMENT]
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 *   put:
 *     tags: [Transactions]
 *     summary: Update transaction
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
 *               amount:
 *                 type: number
 *               merchant:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *   delete:
 *     tags: [Transactions]
 *     summary: Delete transaction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List categories
 *     description: Get all active categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *   post:
 *     tags: [Categories]
 *     summary: Create category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *   put:
 *     tags: [Categories]
 *     summary: Update category
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
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *   delete:
 *     tags: [Categories]
 *     summary: Delete category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 */

export {};
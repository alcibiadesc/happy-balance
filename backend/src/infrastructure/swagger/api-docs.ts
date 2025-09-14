/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check API health status
 *     description: Returns the current health status of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Create a new transaction
 *     description: Creates a new financial transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionRequest'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get transactions with filters
 *     description: Retrieve a list of transactions with optional filters and pagination
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: Filter transactions from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: Filter transactions up to this date (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, INVESTMENT]
 *         description: Filter by transaction type
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: merchantName
 *         schema:
 *           type: string
 *         description: Filter by merchant name (partial match)
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum transaction amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum transaction amount
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *         description: Filter by currency code
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *
 *   delete:
 *     tags:
 *       - Transactions
 *     summary: Delete all transactions
 *     description: Deletes all transactions from the database (use with caution)
 *     responses:
 *       200:
 *         description: All transactions deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /transactions/statistics:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get transaction statistics
 *     description: Retrieve statistical analysis of transactions
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: Start date for statistics calculation
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: End date for statistics calculation
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           default: EUR
 *         description: Currency for calculations
 *     responses:
 *       200:
 *         description: Transaction statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Statistics'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /transactions/dashboard:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get dashboard data
 *     description: Retrieve comprehensive dashboard data including summaries, trends, and breakdowns
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: Start date for dashboard data (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: End date for dashboard data (YYYY-MM-DD)
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           default: EUR
 *         description: Currency for all calculations
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardData'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get transaction by ID
 *     description: Retrieve a specific transaction by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     tags:
 *       - Transactions
 *     summary: Update transaction
 *     description: Update an existing transaction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTransactionRequest'
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     tags:
 *       - Transactions
 *     summary: Delete transaction
 *     description: Delete a specific transaction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /import/csv:
 *   post:
 *     tags:
 *       - Import
 *     summary: Import transactions from CSV
 *     description: Import financial transactions from a CSV file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file to import
 *               mappings:
 *                 type: object
 *                 description: Column mappings for CSV fields
 *     responses:
 *       200:
 *         description: Import successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imported:
 *                   type: integer
 *                   description: Number of transactions imported
 *                 skipped:
 *                   type: integer
 *                   description: Number of transactions skipped
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /import/excel:
 *   post:
 *     tags:
 *       - Import
 *     summary: Import transactions from Excel
 *     description: Import financial transactions from an Excel file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file to import
 *               sheet:
 *                 type: string
 *                 description: Sheet name to import from
 *               mappings:
 *                 type: object
 *                 description: Column mappings for Excel fields
 *     responses:
 *       200:
 *         description: Import successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imported:
 *                   type: integer
 *                 skipped:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /import/preview:
 *   post:
 *     tags:
 *       - Import
 *     summary: Preview CSV file
 *     description: Preview the contents of a CSV file before import
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file to preview
 *     responses:
 *       200:
 *         description: File preview
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportPreview'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /import/validate:
 *   post:
 *     tags:
 *       - Import
 *     summary: Validate CSV file
 *     description: Validate a CSV file for import compatibility
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file to validate
 *               mappings:
 *                 type: object
 *                 description: Column mappings for validation
 *     responses:
 *       200:
 *         description: Validation results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportValidation'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /import/check-duplicates:
 *   post:
 *     tags:
 *       - Import
 *     summary: Check for duplicate transactions
 *     description: Check if transactions already exist in the database based on hashes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DuplicateCheck'
 *     responses:
 *       200:
 *         description: Duplicate check results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DuplicateCheckResult'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /import/selected:
 *   post:
 *     tags:
 *       - Import
 *     summary: Import selected transactions
 *     description: Import only selected transactions from a previous validation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateTransactionRequest'
 *               skipDuplicates:
 *                 type: boolean
 *                 default: true
 *                 description: Skip transactions that already exist
 *     responses:
 *       200:
 *         description: Selected import results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imported:
 *                   type: integer
 *                 skipped:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /import/history:
 *   get:
 *     tags:
 *       - Import
 *     summary: Get import history
 *     description: Retrieve the history of all import operations
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of history entries to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Import history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ImportHistory'
 */

/**
 * @swagger
 * /preferences:
 *   get:
 *     tags:
 *       - User Preferences
 *     summary: Get current user preferences
 *     description: Retrieve preferences for the current user
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPreferences'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   post:
 *     tags:
 *       - User Preferences
 *     summary: Create user preferences
 *     description: Create new preferences for a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferences'
 *     responses:
 *       201:
 *         description: Preferences created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /preferences/{userId}:
 *   get:
 *     tags:
 *       - User Preferences
 *     summary: Get user preferences by ID
 *     description: Retrieve preferences for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPreferences'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     tags:
 *       - User Preferences
 *     summary: Update user preferences
 *     description: Update preferences for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferences'
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     tags:
 *       - User Preferences
 *     summary: Delete user preferences
 *     description: Delete preferences for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Preferences deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
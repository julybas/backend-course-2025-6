/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new inventory item
 *     description: Uploads photo and saves inventory item with name and description.
 *     tags:
 *       - Inventory
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               inventory_name:
 *                 type: string
 *                 description: Name of the item
 *               description:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Inventory name is required
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags:
 *       - Inventory
 *     responses:
 *       200:
 *         description: List of all items
 */

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 */

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Update item's name or description
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated
 *       404:
 *         description: Item not found
 */

/**
 * @swagger
 * /inventory/{id}/photo:
 *   get:
 *     summary: Get item photo
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Photo returned
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Photo not found
 */

/**
 * @swagger
 * /inventory/{id}/photo:
 *   put:
 *     summary: Update item photo
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo updated
 *       404:
 *         description: Item not found
 */

/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 */

/**
 * @swagger
 * /RegisterForm.html:
 *   get:
 *     summary: Registration HTML form
 *     tags:
 *       - Forms
 *     responses:
 *       200:
 *         description: Registration form HTML
 */

/**
 * @swagger
 * /SearchForm.html:
 *   get:
 *     summary: Search HTML form
 *     tags:
 *       - Forms
 *     responses:
 *       200:
 *         description: Search form HTML
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search item by ID
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: includePhoto
 *         schema:
 *           type: string
 *         description: "Add photo_url if present"
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 */

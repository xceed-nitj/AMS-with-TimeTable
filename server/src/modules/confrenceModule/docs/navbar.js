/**
 * @swagger
 * tags:
 *   name: Navbar
 *   description: API endpoints for Navbar.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Navbar:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Navbar ID
 *         confId:
 *           type: string
 *           description: Conference ID
 *         heading:
 *           type: string
 *           description: Navbar heading
 *         subHeading:
 *           type: string
 *           description: Navbar subheading
 *         url:
 *           type: string
 *           description: Navbar URL
 *         name:
 *           type: string
 *           description: Navbar name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation Date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last Update Date
 */

/**
 * @swagger
 * /navbar:
 *   get:
 *     tags: [Navbar]
 *     summary: Get all Navbar items
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Navbar'
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     tags: [Navbar]
 *     summary: Create a new Navbar item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Navbar'
 *     responses:
 *       201:
 *         description: Success
 *       500:
 *         description: Internal server error
 *
 * /navbar/{id}:
 *   get:
 *     tags: [Navbar]
 *     summary: Get Navbar item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Navbar ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Navbar'
 *       404:
 *         description: Navbar item not found
 *       500:
 *         description: Internal server error
 *
 *   put:
 *     tags: [Navbar]
 *     summary: Update Navbar item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Navbar ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Navbar'
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       404:
 *         description: Navbar item not found
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     tags: [Navbar]
 *     summary: Delete Navbar item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Navbar ID
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Navbar item not found
 *       500:
 *         description: Internal server error
 */

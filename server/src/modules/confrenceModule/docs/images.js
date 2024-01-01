/**
 * @swagger
 * tags:
 *   name: Images
 *   description: API endpoints for managing images
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Image ID
 *         confId:
 *           type: string
 *           description: Conference ID
 *         name:
 *           type: string
 *           description: Image name
 *         imgLink:
 *           type: string
 *           description: Image link
 *         feature:
 *           type: boolean
 *           description: Indicates if the image is featured
 *         sequence:
 *           type: number
 *           description: Sequence number for ordering images
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Image creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Image last update date
 */

/**
 * @swagger
 * /images/{confId}:
 *   get:
 *     summary: Get an image by conference ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: confId
 *         schema:
 *           type: string
 *         required: true
 *         description: Conference ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Image'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *
 * /images:
 *   post:
 *     summary: Add a new image
 *     tags: [Images]
 *     requestBody:
 *       description: Image object to be added
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewImage'
 *     responses:
 *       201:
 *         description: Image added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *
 * /images/{imgID}:
 *   put:
 *     summary: Update an image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: imgID
 *         schema:
 *           type: string
 *         required: true
 *         description: Image ID
 *     requestBody:
 *       description: Image object to be updated
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewImage'
 *     responses:
 *       200:
 *         description: Image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *
 *   delete:
 *     summary: Delete an image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: imgID
 *         schema:
 *           type: string
 *         required: true
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *
 *
 * components:
 *   schemas:
 *     NewImage:
 *       description: Image object while adding or updating
 *       hidden: true
 *       type: object
 *       properties:
 *         confId:
 *           type: string
 *           description: Conference ID
 *         name:
 *           type: string
 *           description: Image name
 *         imgLink:
 *           type: string
 *           description: Image link
 *         feature:
 *           type: boolean
 *           description: Indicates if the image is featured
 *         sequence:
 *           type: number
 *           description: Sequence number for ordering images
 */

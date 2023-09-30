/**
 * @swagger
 * tags:
 *   name: Location
 *   description: API endpoints for managing conference locations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Location ID
 *         confId:
 *           type: string
 *           description: Conference ID
 *         description:
 *           type: string
 *           description: Location description
 *         address:
 *           type: string
 *           description: Location address
 *         latitude:
 *           type: string
 *           description: Location latitude
 *         longitude:
 *           type: string
 *           description: Location longitude
 *         feature:
 *           type: boolean
 *           description: Indicates if the location is featured
 *         sequence:
 *           type: number
 *           description: Sequence number for ordering locations
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Location creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Location last update date
 */

/**
 * @swagger
 * /locations/{confId}:
 *   get:
 *     summary: Get conference locations by conference ID
 *     tags: [Location]
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
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Location'
 *       404:
 *         description: No locations found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *
 * /locations:
 *   post:
 *     summary: Add a new location
 *     tags: [Location]
 *     requestBody:
 *       description: Location object to be added
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewLocation'
 *     responses:
 *       201:
 *         description: Location added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *
 * /locations/{id}:
 *   put:
 *     summary: Update a location by ID
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Location ID
 *     requestBody:
 *       description: Location object to be updated
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewLocation'
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *
 *   delete:
 *     summary: Delete a location by ID
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *
 * components:
 *   schemas:
 *     NewLocation:
 *       type: object
 *       properties:
 *         confId:
 *           type: string
 *           description: Conference ID
 *         description:
 *           type: string
 *           description: Location description
 *         address:
 *           type: string
 *           description: Location address
 *         latitude:
 *           type: string
 *           description: Location latitude
 *         longitude:
 *           type: string
 *           description: Location longitude
 *         feature:
 *           type: boolean
 *           description: Indicates if the location is featured
 *         sequence:
 *           type: number
 *           description: Sequence number for ordering locations
 */

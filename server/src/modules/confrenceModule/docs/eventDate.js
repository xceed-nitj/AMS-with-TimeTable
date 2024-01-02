/**
 * @swagger
 * tags:
 *   name: EventDates
 *   description: API endpoints for Event Dates
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EventDate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Event Date ID
 *         confId:
 *           type: string
 *           description: Conference ID
 *         title:
 *           type: string
 *           description: Event Date title
 *         date:
 *           type: string
 *           format: date-time
 *           description: Event Date date
 *         sequence:
 *           type: number
 *           description: Event Date sequence
 *         extended:
 *           type: boolean
 *           description: Event Date extended
 *         newDate:
 *           type: string
 *           format: date-time
 *           description: Event Date new date
 *         completed:
 *           type: boolean
 *           description: Event Date completed
 *         featured:
 *           type: boolean
 *           description: Event Date featured
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Event Date creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Event Date last update date
 */

/**
 * @swagger
 * /eventDates/conference/{id}:
 *   get:
 *     summary: Get event dates by conference ID
 *     tags: [EventDates]
 *     description: Retrieve event dates based on the conference ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Conference ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Event Date not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /eventDates:
 *   get:
 *     tags: [EventDates]
 *     summary: Get all event dates
 *     description: Retrieve all event dates
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   post:
 *     tags: [EventDates]
 *     summary: Create a new event date
 *     description: Create a new event date
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventDate'
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /eventDates/{id}:
 *   get:
 *     tags: [EventDates]
 *     summary: Get an event date by ID
 *     description: Retrieve an event date by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Event Date ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Event Date not found
 *       500:
 *         description: Internal server error
 *   put:
 *     tags: [EventDates]
 *     summary: Update an event date by ID
 *     description: Update an event date by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Event Date ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventDate'
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       404:
 *         description: Event Date not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags: [EventDates]
 *     summary: Delete an event date by ID
 *     description: Delete an event date by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Event Date ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Event Date not found
 *       500:
 *         description: Internal server error
 */

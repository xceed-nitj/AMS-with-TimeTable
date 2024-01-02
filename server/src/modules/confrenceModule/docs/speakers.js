/**
 * @swagger
 * tags:
 *   name: Speakers
 *   description: API endpoints for Speakers
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SpeakersModel:
 *       type: object
 *       properties:
 *         ConfId:
 *           type: string
 *           description: Conference ID
 *         Name:
 *           type: string
 *           description: Speaker's Name
 *         Designation:
 *           type: string
 *           description: Speaker's Designation
 *         Institute:
 *           type: string
 *           description: Speaker's Institute
 *         ProfileLink:
 *           type: string
 *           description: Link to Speaker's Profile
 *         ImgLink:
 *           type: string
 *           description: Link to Speaker's Image
 *         TalkType:
 *           type: string
 *           description: Type of Talk
 *         TalkTitle:
 *           type: string
 *           description: Title of Talk
 *         Abstract:
 *           type: string
 *           description: Talk Abstract
 *         Bio:
 *           type: string
 *           description: Speaker's Biography
 *         sequence:
 *           type: number
 *           description: Sequence number
 *         feature:
 *           type: boolean
 *           description: Whether the speaker is featured
 */

/**
 * @swagger
 * /speakers/conference/{id}:
 *   get:
 *     summary: Get speakers by conference ID
 *     tags: [Speakers]
 *     description: Retrieve speakers based on the conference ID
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
 *         description: Speaker not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /speakers:
 *   get:
 *     tags: [Speakers]
 *     summary: Get all speakers
 *     description: Retrieve all speakers
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   post:
 *     tags: [Speakers]
 *     summary: Create a new speaker
 *     description: Create a new speaker
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpeakersModel'
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /speakers/{id}:
 *   get:
 *     tags: [Speakers]
 *     summary: Get a speaker by ID
 *     description: Retrieve a speaker by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Speaker ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Speaker not found
 *       500:
 *         description: Internal server error
 *   put:
 *     tags: [Speakers]
 *     summary: Update a speaker by ID
 *     description: Update a speaker by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Speaker ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpeakersModel'
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Speaker not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags: [Speakers]
 *     summary: Delete a speaker by ID
 *     description: Delete a speaker by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Speaker ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Speaker not found
 *       500:
 *         description: Internal server error
 */

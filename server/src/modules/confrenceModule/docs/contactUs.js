/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: API endpoints for Contact Us.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactUs:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Contact ID
 *         confId:
 *           type: string
 *           description: Conference ID
 *         title:
 *           type: string
 *           description: Contact title
 *         name:
 *           type: string
 *           description: Contact name
 *         designation:
 *           type: string
 *           description: Contact designation
 *         imgLink:
 *           type: string
 *           description: Contact image link
 *         institute:
 *           type: string
 *           description: Contact institute
 *         profileLink:
 *           type: string
 *           description: Contact profile link
 *         phone:
 *           type: string
 *           description: Contact phone number
 *         email:
 *           type: string
 *           description: Contact email address
 *         fax:
 *           type: string
 *           description: Contact fax number
 *         feature:
 *           type: boolean
 *           description: Indicates if the contact is featured
 *         sequence:
 *           type: number
 *           description: Sequence number for ordering contacts
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Contact creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Contact last update date
 */

/**
 * @swagger
 * /contacts/{confId}:
 *   get:
 *     tags: [Contact]
 *     summary: Get all contacts by conference ID
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
 *                 $ref: '#/components/schemas/ContactUs'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       404:
 *         description: No contacts found
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
 * /contacts:
 *   post:
 *     tags: [Contact]
 *     summary: Add a new contact
 *     requestBody:
 *       description: Contact object to be added
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            properties:
 *             confId:
 *              type: string
 *              description: Conference ID
 *             title:
 *              type: string
 *              description: Contact title
 *             name:
 *              type: string
 *              description: Contact name
 *             designation:
 *              type: string
 *              description: Contact designation
 *             imgLink:
 *              type: string
 *              description: Contact image link
 *             institute:
 *              type: string
 *              description: Contact institute
 *             profileLink:
 *              type: string
 *              description: Contact profile link
 *             phone:
 *              type: string
 *              description: Contact phone number
 *             email:
 *              type: string
 *              description: Contact email address
 *             fax:
 *              type: string
 *              required: false
 *              description: Contact fax number
 *             feature:
 *              type: boolean
 *              description: Indicates if the contact is featured
 *             sequence:
 *              type: number
 *              description: Sequence number for ordering contacts
 *     responses:
 *       201:
 *         description: Contact added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
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
 * /contacts/{id}:
 *   put:
 *     tags: [Contact]
 *     summary: Update a contact by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Contact ID
 *     requestBody:
 *       description: Contact object to be updated
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            properties:
 *             confId:
 *              type: string
 *              description: Conference ID
 *             title:
 *              type: string
 *              description: Contact title
 *             name:
 *              type: string
 *              description: Contact name
 *             designation:
 *              type: string
 *              description: Contact designation
 *             imgLink:
 *              type: string
 *              description: Contact image link
 *             institute:
 *              type: string
 *              description: Contact institute
 *             profileLink:
 *              type: string
 *              description: Contact profile link
 *             phone:
 *              type: string
 *              description: Contact phone number
 *             email:
 *              type: string
 *              description: Contact email address
 *             fax:
 *              type: string
 *              required: false
 *              description: Contact fax number
 *             feature:
 *              type: boolean
 *              description: Indicates if the contact is featured
 *             sequence:
 *              type: number
 *              description: Sequence number for ordering contacts
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactUs'
 *       400:
 *         description: Bad request
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
 *   delete:
 *     tags: [Contact]
 *     summary: Delete a contact by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
 */

const express = require("express");
const {
  listTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
} = require("../services/ticketService");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RepairTicket:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         customerName:
 *           type: string
 *         customerPhone:
 *           type: string
 *         productName:
 *           type: string
 *         productCategory:
 *           type: string
 *         serialNumber:
 *           type: string
 *         purchaseDate:
 *           type: string
 *           format: date
 *         warrantyStatus:
 *           type: string
 *         issueDescription:
 *           type: string
 *         status:
 *           type: string
 *         priority:
 *           type: string
 *         technicianId:
 *           type: integer
 *           nullable: true
 *         technicianName:
 *           type: string
 *           nullable: true
 *     TicketInput:
 *       type: object
 *       required:
 *         - customerName
 *         - customerPhone
 *         - productName
 *         - productCategory
 *         - serialNumber
 *         - purchaseDate
 *         - issueDescription
 *         - status
 *         - priority
 *       properties:
 *         customerName:
 *           type: string
 *           example: Sara Johnson
 *         customerPhone:
 *           type: string
 *           example: "+90 555 123 4567"
 *         productName:
 *           type: string
 *           example: Dell Inspiron 15
 *         productCategory:
 *           type: string
 *           enum: [Laptop, Phone, Tablet, Home Appliance, Other]
 *         serialNumber:
 *           type: string
 *           example: SN-2026-001
 *         purchaseDate:
 *           type: string
 *           format: date
 *           example: "2025-04-10"
 *         issueDescription:
 *           type: string
 *           example: Device shuts down during charging.
 *         status:
 *           type: string
 *           enum: [Received, In Repair, Waiting Part, Completed, Delivered]
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High, Urgent]
 *         technicianId:
 *           type: integer
 *           nullable: true
 */

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: List repair tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of repair tickets
 */
router.get("/", async (req, res, next) => {
  try {
    const tickets = await listTickets(req.user, req.query);
    res.json(tickets);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get a repair ticket by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Repair ticket details
 *       404:
 *         description: Ticket not found
 */
router.get("/:id", async (req, res, next) => {
  try {
    const ticket = await getTicketById(req.user, Number(req.params.id));
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create a repair ticket
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TicketInput'
 *     responses:
 *       201:
 *         description: Ticket created
 *       400:
 *         description: Validation error
 */
router.post("/", async (req, res, next) => {
  try {
    const ticket = await createTicket(req.user, req.body);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     summary: Update a repair ticket
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/TicketInput'
 *     responses:
 *       200:
 *         description: Ticket updated
 *       404:
 *         description: Ticket not found
 */
router.put("/:id", async (req, res, next) => {
  try {
    const ticket = await updateTicket(req.user, Number(req.params.id), req.body);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     summary: Delete a repair ticket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Ticket deleted
 *       404:
 *         description: Ticket not found
 */
router.delete("/:id", async (req, res, next) => {
  try {
    await deleteTicket(req.user, Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require("express");
const { listTechnicians } = require("../services/technicianService");

const router = express.Router();

/**
 * @swagger
 * /api/technicians:
 *   get:
 *     summary: List technicians
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available technicians
 */
router.get("/", async (req, res, next) => {
  try {
    const technicians = await listTechnicians();
    res.json(technicians);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require("express");
const { listUsers, updateUserRole } = require("../services/authService");

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users listed
 *       403:
 *         description: Admin access is required
 */
router.get("/", async (req, res, next) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update a user's role
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
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User role updated
 *       403:
 *         description: Admin access is required
 */
router.put("/:id/role", async (req, res, next) => {
  try {
    const user = await updateUserRole(req.user.id, Number(req.params.id), req.body.role);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

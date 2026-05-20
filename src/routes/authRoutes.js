const express = require("express");
const { register, login } = require("../services/authService");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: User One
 *               email:
 *                 type: string
 *                 example: user1@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered
 */
router.post("/register", async (req, res, next) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user1@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

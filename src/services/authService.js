const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getData, saveData, getNextId } = require("../db/database");
const { jwtSecret } = require("../config");
const createHttpError = require("../utils/httpError");

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function validateAuthInput(payload, { requireName = false } = {}) {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === "string" ? payload.password : "";
  const errors = [];

  if (requireName && name.length < 2) {
    errors.push("Name must be at least 2 characters.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email must be valid.");
  }

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters.");
  }

  return { data: { name, email, password }, errors };
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user"
    },
    jwtSecret,
    { expiresIn: "2h" }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "user"
  };
}

async function register(payload) {
  const { data, errors } = validateAuthInput(payload, { requireName: true });
  if (errors.length) {
    throw createHttpError(400, errors.join(" "));
  }

  const db = await getData();
  const exists = db.users.some((user) => user.email === data.email);

  if (exists) {
    throw createHttpError(409, "A user with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = {
    id: getNextId(db.users),
    name: data.name,
    email: data.email,
    passwordHash,
    role: "user",
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  await saveData();

  return {
    token: createToken(user),
    user: publicUser(user)
  };
}

async function login(payload) {
  const { data, errors } = validateAuthInput(payload);
  if (errors.length) {
    throw createHttpError(400, errors.join(" "));
  }

  const db = await getData();
  const user = db.users.find((item) => item.email === data.email);
  const matches = user ? await bcrypt.compare(data.password, user.passwordHash) : false;

  if (!matches) {
    throw createHttpError(401, "Invalid email or password.");
  }

  return {
    token: createToken(user),
    user: publicUser(user)
  };
}

async function listUsers() {
  const db = await getData();
  return db.users
    .map(publicUser)
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function updateUserRole(adminUserId, userId, role) {
  if (!["user", "admin"].includes(role)) {
    throw createHttpError(400, "Role must be either user or admin.");
  }

  const db = await getData();
  const user = db.users.find((item) => item.id === Number(userId));

  if (!user) {
    throw createHttpError(404, "User not found.");
  }

  if (user.id === Number(adminUserId) && role !== "admin") {
    throw createHttpError(400, "You cannot remove your own admin role.");
  }

  user.role = role;
  await saveData();

  return publicUser(user);
}

module.exports = {
  validateAuthInput,
  register,
  login,
  listUsers,
  updateUserRole
};

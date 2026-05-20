const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");
const createHttpError = require("../utils/httpError");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(createHttpError(401, "Authentication token is required."));
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (error) {
    return next(createHttpError(401, "Invalid or expired authentication token."));
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return next(createHttpError(403, "Admin access is required."));
  }

  return next();
}

module.exports = {
  authenticate,
  requireAdmin
};

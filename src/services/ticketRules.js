const STATUSES = ["Received", "In Repair", "Waiting Part", "Completed", "Delivered"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const CATEGORIES = ["Laptop", "Phone", "Tablet", "Home Appliance", "Other"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function calculateWarrantyStatus(purchaseDate, today = new Date()) {
  if (!isValidDate(purchaseDate)) {
    return "Unknown";
  }

  const purchase = new Date(`${purchaseDate}T00:00:00.000Z`);
  const warrantyEnd = new Date(purchase);
  warrantyEnd.setUTCFullYear(warrantyEnd.getUTCFullYear() + 2);

  return warrantyEnd >= today ? "Under Warranty" : "Expired";
}

function validateTicketInput(payload, { partial = false } = {}) {
  const errors = [];
  const data = {};

  const requiredFields = [
    "customerName",
    "customerPhone",
    "productName",
    "productCategory",
    "serialNumber",
    "purchaseDate",
    "issueDescription",
    "status",
    "priority"
  ];

  for (const field of requiredFields) {
    if (!partial || Object.prototype.hasOwnProperty.call(payload, field)) {
      data[field] = normalizeText(payload[field]);
      if (!data[field]) {
        errors.push(`${field} is required.`);
      }
    }
  }

  if (data.customerPhone && !/^[0-9+\-\s()]{7,20}$/.test(data.customerPhone)) {
    errors.push("customerPhone must be a valid phone number.");
  }

  if (data.productCategory && !CATEGORIES.includes(data.productCategory)) {
    errors.push(`productCategory must be one of: ${CATEGORIES.join(", ")}.`);
  }

  if (data.purchaseDate && !isValidDate(data.purchaseDate)) {
    errors.push("purchaseDate must use YYYY-MM-DD format.");
  }

  if (data.status && !STATUSES.includes(data.status)) {
    errors.push(`status must be one of: ${STATUSES.join(", ")}.`);
  }

  if (data.priority && !PRIORITIES.includes(data.priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(", ")}.`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "technicianId")) {
    if (payload.technicianId === null || payload.technicianId === "") {
      data.technicianId = null;
    } else {
      const technicianId = Number(payload.technicianId);
      if (!Number.isInteger(technicianId) || technicianId < 1) {
        errors.push("technicianId must be a positive integer.");
      } else {
        data.technicianId = technicianId;
      }
    }
  } else if (!partial) {
    data.technicianId = null;
  }

  return { data, errors };
}

module.exports = {
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  calculateWarrantyStatus,
  validateTicketInput
};

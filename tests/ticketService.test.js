const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateWarrantyStatus,
  validateTicketInput
} = require("../src/services/ticketRules");

test("calculateWarrantyStatus returns Under Warranty within two years", () => {
  const today = new Date("2026-05-19T00:00:00.000Z");
  assert.equal(calculateWarrantyStatus("2025-05-19", today), "Under Warranty");
});

test("calculateWarrantyStatus returns Expired after two years", () => {
  const today = new Date("2026-05-19T00:00:00.000Z");
  assert.equal(calculateWarrantyStatus("2023-05-18", today), "Expired");
});

test("validateTicketInput accepts a complete valid ticket", () => {
  const { errors, data } = validateTicketInput({
    customerName: "Sara Johnson",
    customerPhone: "+90 555 123 4567",
    productName: "Dell Inspiron 15",
    productCategory: "Laptop",
    serialNumber: "SN-001",
    purchaseDate: "2025-04-10",
    issueDescription: "Battery drains quickly.",
    status: "Received",
    priority: "Medium",
    technicianId: 1
  });

  assert.deepEqual(errors, []);
  assert.equal(data.customerName, "Sara Johnson");
  assert.equal(data.technicianId, 1);
});

test("validateTicketInput rejects invalid category, status, date and phone", () => {
  const { errors } = validateTicketInput({
    customerName: "A",
    customerPhone: "abc",
    productName: "Phone",
    productCategory: "Car",
    serialNumber: "SN-002",
    purchaseDate: "2026-15-99",
    issueDescription: "Screen problem",
    status: "Lost",
    priority: "Medium"
  });

  assert.equal(errors.some((error) => error.includes("customerPhone")), true);
  assert.equal(errors.some((error) => error.includes("productCategory")), true);
  assert.equal(errors.some((error) => error.includes("purchaseDate")), true);
  assert.equal(errors.some((error) => error.includes("status")), true);
});

test("validateTicketInput supports partial updates", () => {
  const { errors, data } = validateTicketInput(
    {
      status: "Completed"
    },
    { partial: true }
  );

  assert.deepEqual(errors, []);
  assert.deepEqual(data, { status: "Completed" });
});

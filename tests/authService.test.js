const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAuthInput, updateUserRole } = require("../src/services/authService");

test("validateAuthInput accepts valid registration input", () => {
  const { data, errors } = validateAuthInput(
    {
      name: "User One",
      email: "USER1@EXAMPLE.COM",
      password: "secret123"
    },
    { requireName: true }
  );

  assert.deepEqual(errors, []);
  assert.equal(data.email, "user1@example.com");
});

test("validateAuthInput rejects weak authentication input", () => {
  const { errors } = validateAuthInput(
    {
      name: "A",
      email: "wrong-email",
      password: "123"
    },
    { requireName: true }
  );

  assert.equal(errors.some((error) => error.includes("Name")), true);
  assert.equal(errors.some((error) => error.includes("Email")), true);
  assert.equal(errors.some((error) => error.includes("Password")), true);
});

test("public auth validation does not allow users to choose an admin role", () => {
  const { data, errors } = validateAuthInput(
    {
      name: "Role Test",
      email: "role@example.com",
      password: "secret123",
      role: "admin"
    },
    { requireName: true }
  );

  assert.deepEqual(errors, []);
  assert.equal(Object.prototype.hasOwnProperty.call(data, "role"), false);
});

test("updateUserRole rejects invalid role names", async () => {
  await assert.rejects(
    () => updateUserRole(1, 2, "owner"),
    /Role must be either user or admin/
  );
});

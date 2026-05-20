const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcryptjs");
const { databasePath } = require("../config");

const seedTechnicians = [
  { id: 1, name: "Ayse Demir", specialty: "Laptop Repair" },
  { id: 2, name: "Mehmet Kaya", specialty: "Mobile Devices" },
  { id: 3, name: "Elif Yilmaz", specialty: "Home Appliances" }
];

const adminEmail = "admin@example.com";
const adminPassword = "admin123";

let data;

async function loadData() {
  if (data) {
    return data;
  }

  try {
    const raw = await fs.readFile(databasePath, "utf8");
    data = JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    data = {
      users: [],
      technicians: seedTechnicians,
      repairTickets: []
    };
    await saveData();
  }

  return data;
}

async function saveData() {
  await fs.mkdir(path.dirname(databasePath), { recursive: true });
  await fs.writeFile(databasePath, JSON.stringify(data, null, 2));
}

async function initDatabase() {
  const current = await loadData();

  if (!Array.isArray(current.technicians) || current.technicians.length === 0) {
    current.technicians = seedTechnicians;
  }

  if (!Array.isArray(current.users)) {
    current.users = [];
  }

  for (const user of current.users) {
    if (!user.role) {
      user.role = "user";
    }
  }

  const hasAdmin = current.users.some((user) => user.role === "admin");
  if (!hasAdmin) {
    current.users.push({
      id: getNextId(current.users),
      name: "System Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "admin",
      createdAt: new Date().toISOString()
    });
  }

  if (!Array.isArray(current.repairTickets)) {
    current.repairTickets = [];
  }

  await saveData();
}

async function getData() {
  return loadData();
}

function getNextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

async function closeDatabase() {
  data = null;
}

module.exports = {
  initDatabase,
  getData,
  saveData,
  getNextId,
  closeDatabase
};

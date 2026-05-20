const { getData, saveData, getNextId } = require("../db/database");
const createHttpError = require("../utils/httpError");
const {
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  calculateWarrantyStatus,
  validateTicketInput
} = require("./ticketRules");

function withTechnician(ticket, technicians, users = []) {
  const technician = technicians.find((item) => item.id === ticket.technicianId);
  const owner = users.find((item) => item.id === ticket.userId);

  return {
    ...ticket,
    ticketNumber: formatTicketNumber(ticket),
    warrantyStatus: calculateWarrantyStatus(ticket.purchaseDate),
    technicianName: technician ? technician.name : null,
    technicianSpecialty: technician ? technician.specialty : null,
    ownerName: owner ? owner.name : "Unknown User",
    ownerEmail: owner ? owner.email : null,
    activityLog: Array.isArray(ticket.activityLog) ? ticket.activityLog : []
  };
}

function formatTicketNumber(ticket) {
  const year = ticket.createdAt ? new Date(ticket.createdAt).getFullYear() : new Date().getFullYear();
  return `RMA-${year}-${String(ticket.id).padStart(4, "0")}`;
}

function canAccessTicket(user, ticket) {
  return user.role === "admin" || ticket.userId === Number(user.id);
}

function createActivityEntry(user, action, details = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    action,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    timestamp: new Date().toISOString(),
    ...details
  };
}

async function listTickets(user, filters = {}) {
  const db = await getData();
  const search = filters.search ? filters.search.trim().toLowerCase() : "";

  return db.repairTickets
    .filter((ticket) => {
      const matchesUser = canAccessTicket(user, ticket);
      const matchesSearch =
        !search ||
        ticket.customerName.toLowerCase().includes(search) ||
        ticket.productName.toLowerCase().includes(search) ||
        ticket.serialNumber.toLowerCase().includes(search);
      const matchesStatus = !filters.status || ticket.status === filters.status;
      const matchesPriority = !filters.priority || ticket.priority === filters.priority;
      const matchesOwner =
        user.role !== "admin" || !filters.ownerId || ticket.userId === Number(filters.ownerId);

      return matchesUser && matchesSearch && matchesStatus && matchesPriority && matchesOwner;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map((ticket) => withTechnician(ticket, db.technicians, db.users));
}

async function getTicketById(user, id) {
  const db = await getData();
  const ticket = db.repairTickets.find((item) => item.id === Number(id) && canAccessTicket(user, item));

  if (!ticket) {
    throw createHttpError(404, "Ticket not found.");
  }

  return withTechnician(ticket, db.technicians, db.users);
}

async function ensureTechnicianExists(technicianId) {
  if (!technicianId) {
    return;
  }

  const db = await getData();
  const technician = db.technicians.find((item) => item.id === Number(technicianId));
  if (!technician) {
    throw createHttpError(400, "Selected technician does not exist.");
  }
}

async function createTicket(user, payload) {
  const { data, errors } = validateTicketInput(payload);
  if (errors.length) {
    throw createHttpError(400, errors.join(" "));
  }

  await ensureTechnicianExists(data.technicianId);

  const db = await getData();
  const serialExists = db.repairTickets.some(
    (ticket) =>
      ticket.userId === Number(user.id) &&
      ticket.serialNumber.toLowerCase() === data.serialNumber.toLowerCase()
  );

  if (serialExists) {
    throw createHttpError(409, "A ticket with this serial number already exists.");
  }

  const now = new Date().toISOString();
  const ticket = {
    id: getNextId(db.repairTickets),
    userId: Number(user.id),
    ...data,
    activityLog: [
      createActivityEntry(user, "created", {
        note: "Ticket created."
      })
    ],
    createdAt: now,
    updatedAt: now
  };

  db.repairTickets.push(ticket);
  await saveData();

  return withTechnician(ticket, db.technicians, db.users);
}

async function updateTicket(user, id, payload) {
  const db = await getData();
  const ticket = db.repairTickets.find((item) => item.id === Number(id) && canAccessTicket(user, item));

  if (!ticket) {
    throw createHttpError(404, "Ticket not found.");
  }

  const { data, errors } = validateTicketInput(payload, { partial: true });
  if (errors.length) {
    throw createHttpError(400, errors.join(" "));
  }

  if (Object.keys(data).length === 0) {
    throw createHttpError(400, "At least one field is required for update.");
  }

  const previousStatus = ticket.status;
  const nextStatus = data.status || ticket.status;
  const statusNote =
    typeof payload.statusNote === "string" && payload.statusNote.trim()
      ? payload.statusNote.trim()
      : "";

  await ensureTechnicianExists(data.technicianId);

  if (data.serialNumber) {
    const serialExists = db.repairTickets.some(
      (item) =>
        item.id !== ticket.id &&
        item.userId === ticket.userId &&
        item.serialNumber.toLowerCase() === data.serialNumber.toLowerCase()
    );

    if (serialExists) {
      throw createHttpError(409, "A ticket with this serial number already exists.");
    }
  }

  Object.assign(ticket, data, { updatedAt: new Date().toISOString() });

  if (!Array.isArray(ticket.activityLog)) {
    ticket.activityLog = [];
  }

  if (previousStatus !== nextStatus) {
    ticket.activityLog.push(
      createActivityEntry(user, "status_changed", {
        fromStatus: previousStatus,
        toStatus: nextStatus,
        note: statusNote || "Status updated."
      })
    );
  } else {
    ticket.activityLog.push(
      createActivityEntry(user, "updated", {
        note: statusNote || "Ticket details updated."
      })
    );
  }

  await saveData();

  return withTechnician(ticket, db.technicians, db.users);
}

async function deleteTicket(user, id) {
  const db = await getData();
  const index = db.repairTickets.findIndex(
    (ticket) => ticket.id === Number(id) && canAccessTicket(user, ticket)
  );

  if (index === -1) {
    throw createHttpError(404, "Ticket not found.");
  }

  db.repairTickets.splice(index, 1);
  await saveData();
}

module.exports = {
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  calculateWarrantyStatus,
  validateTicketInput,
  listTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
};

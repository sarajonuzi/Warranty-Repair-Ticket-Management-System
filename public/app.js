const api = {
  tickets: "/api/tickets",
  technicians: "/api/technicians"
};

const statusSteps = ["Received", "In Repair", "Waiting Part", "Completed", "Delivered"];
const tokenKey = "repairTicketToken";
const userKey = "repairTicketUser";
const token = localStorage.getItem(tokenKey);

if (!token) {
  window.location.href = "/login.html";
}

const state = {
  tickets: [],
  technicians: [],
  owners: [],
  user: {}
};

const elements = {
  form: document.querySelector("#ticketForm"),
  formTitle: document.querySelector("#formTitle"),
  formError: document.querySelector("#formError"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  ticketList: document.querySelector("#ticketList"),
  metricsGrid: document.querySelector("#metricsGrid"),
  summary: document.querySelector("#summary"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  ownerFilterWrap: document.querySelector("#ownerFilterWrap"),
  ownerFilter: document.querySelector("#ownerFilter"),
  technicianId: document.querySelector("#technicianId"),
  userBadge: document.querySelector("#userBadge"),
  usersLink: document.querySelector("#usersLink"),
  logoutButton: document.querySelector("#logoutButton"),
  ticketModal: document.querySelector("#ticketModal"),
  modalTitle: document.querySelector("#modalTitle"),
  modalBody: document.querySelector("#modalBody"),
  closeModalButton: document.querySelector("#closeModalButton")
};

function formValue(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function setFormError(message) {
  elements.formError.textContent = message || "";
}

function validateForm(data) {
  if (data.customerName.length < 2) {
    return "Customer name must be at least 2 characters.";
  }

  if (!/^[0-9+\-\s()]{7,20}$/.test(data.customerPhone)) {
    return "Customer phone must be valid.";
  }

  if (!data.productName || !data.productCategory || !data.serialNumber || !data.purchaseDate) {
    return "Product, category, serial number and purchase date are required.";
  }

  if (data.issueDescription.length < 8) {
    return "Issue description must be at least 8 characters.";
  }

  return "";
}

function getFormData() {
  return {
    customerName: formValue("customerName"),
    customerPhone: formValue("customerPhone"),
    productName: formValue("productName"),
    productCategory: formValue("productCategory"),
    serialNumber: formValue("serialNumber"),
    purchaseDate: formValue("purchaseDate"),
    issueDescription: formValue("issueDescription"),
    status: formValue("status"),
    priority: formValue("priority"),
    technicianId: formValue("technicianId") || null
  };
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed." }));
    if (response.status === 401) {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      window.location.href = "/login.html";
      return null;
    }
    throw new Error(error.message || "Request failed.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function buildQuery() {
  const params = new URLSearchParams();
  const search = elements.searchInput.value.trim();
  const status = elements.statusFilter.value;
  const priority = elements.priorityFilter.value;
  const ownerId = elements.ownerFilter.value;

  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  if (state.user.role === "admin" && ownerId) params.set("ownerId", ownerId);

  return params.toString();
}

async function loadTickets() {
  const query = buildQuery();
  state.tickets = await request(`${api.tickets}${query ? `?${query}` : ""}`);
  updateOwnerCache();
  renderOwnerFilterOptions();
  renderTickets();
}

async function loadTechnicians() {
  state.technicians = await request(api.technicians);
  elements.technicianId.innerHTML = '<option value="">Unassigned</option>';

  for (const technician of state.technicians) {
    const option = document.createElement("option");
    option.value = technician.id;
    option.textContent = `${technician.name} - ${technician.specialty}`;
    elements.technicianId.append(option);
  }
}

function warrantyClass(status) {
  if (status === "Under Warranty") return "ok";
  if (status === "Expired") return "danger";
  return "warn";
}

function renderTickets() {
  renderMetrics();
  elements.summary.textContent = `${state.tickets.length} ticket${state.tickets.length === 1 ? "" : "s"} found`;
  elements.ticketList.innerHTML = "";

  if (state.tickets.length === 0) {
    elements.ticketList.innerHTML = '<div class="empty-state">No tickets match the current filters.</div>';
    return;
  }

  for (const ticket of state.tickets) {
    const card = document.createElement("article");
    card.className = "ticket-card";
    card.innerHTML = `
      <header>
        <div>
          <h3>${escapeHtml(ticket.customerName)} - ${escapeHtml(ticket.productName)}</h3>
          <p class="serial">${escapeHtml(ticket.ticketNumber || `Ticket #${ticket.id}`)} | Serial: ${escapeHtml(ticket.serialNumber)}</p>
        </div>
        <div class="ticket-actions">
          <button class="details-button primary" data-action="details" data-id="${ticket.id}" type="button">Details</button>
          <button class="ghost" data-action="edit" data-id="${ticket.id}" type="button">Edit</button>
          <button class="danger" data-action="delete" data-id="${ticket.id}" type="button">Delete</button>
        </div>
      </header>
      <div class="badges">
        <span class="badge">${escapeHtml(ticket.status)}</span>
        <span class="badge">${escapeHtml(ticket.priority)}</span>
        <span class="badge ${warrantyClass(ticket.warrantyStatus)}">${escapeHtml(ticket.warrantyStatus)}</span>
      </div>
      <div class="status-row">
        <div class="timeline" title="Repair progress">
          ${renderTimeline(ticket.status)}
        </div>
        <label class="quick-status">
          Quick Status
          <select data-action="quick-status" data-id="${ticket.id}">
            ${statusSteps
              .map((status) => `<option ${status === ticket.status ? "selected" : ""}>${status}</option>`)
              .join("")}
          </select>
        </label>
      </div>
      <div class="ticket-details">
        <span><strong>Category</strong>${escapeHtml(ticket.productCategory)}</span>
        <span><strong>Technician</strong>${escapeHtml(ticket.technicianName || "Unassigned")}</span>
        <span><strong>${state.user.role === "admin" ? "Owner" : "Phone"}</strong>${escapeHtml(
          state.user.role === "admin" ? ticket.ownerName || "Unknown User" : ticket.customerPhone
        )}</span>
      </div>
      <p class="issue">${escapeHtml(ticket.issueDescription)}</p>
    `;
    elements.ticketList.append(card);
  }
}

function renderMetrics() {
  const metrics = [
    ["Total Tickets", state.tickets.length],
    ["In Repair", countByStatus("In Repair")],
    ["Waiting Part", countByStatus("Waiting Part")],
    ["Completed", countByStatus("Completed")],
    ["Expired Warranty", state.tickets.filter((ticket) => ticket.warrantyStatus === "Expired").length]
  ];

  elements.metricsGrid.innerHTML = metrics
    .map(
      ([label, value]) => `
        <article class="metric-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `
    )
    .join("");
}

function updateOwnerCache() {
  if (state.user.role !== "admin") return;

  const owners = new Map(state.owners.map((owner) => [owner.id, owner]));
  for (const ticket of state.tickets) {
    if (ticket.userId) {
      owners.set(ticket.userId, {
        id: ticket.userId,
        name: ticket.ownerName || "Unknown User",
        email: ticket.ownerEmail || ""
      });
    }
  }

  state.owners = [...owners.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function renderOwnerFilterOptions() {
  if (state.user.role !== "admin") return;

  const selected = elements.ownerFilter.value;
  elements.ownerFilter.innerHTML = '<option value="">All Users</option>';

  for (const owner of state.owners) {
    const option = document.createElement("option");
    option.value = owner.id;
    option.textContent = owner.email ? `${owner.name} - ${owner.email}` : owner.name;
    elements.ownerFilter.append(option);
  }

  elements.ownerFilter.value = selected;
}

function countByStatus(status) {
  return state.tickets.filter((ticket) => ticket.status === status).length;
}

function renderTimeline(currentStatus) {
  const currentIndex = statusSteps.indexOf(currentStatus);
  return statusSteps
    .map(
      (status, index) =>
        `<span class="timeline-step ${index <= currentIndex ? "done" : ""}" title="${status}"></span>`
    )
    .join("");
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function showTicketDetails(ticket) {
  elements.modalTitle.textContent = ticket.ticketNumber || `Ticket #${ticket.id}`;
  elements.modalBody.innerHTML = `
    <div class="badges">
      <span class="badge">${escapeHtml(ticket.status)}</span>
      <span class="badge">${escapeHtml(ticket.priority)}</span>
      <span class="badge ${warrantyClass(ticket.warrantyStatus)}">${escapeHtml(ticket.warrantyStatus)}</span>
    </div>
    <div class="timeline">
      ${renderTimeline(ticket.status)}
    </div>
    <div class="detail-grid">
      ${detailItem("Customer", ticket.customerName)}
      ${detailItem("Ticket Number", ticket.ticketNumber || `Ticket #${ticket.id}`)}
      ${detailItem("Phone", ticket.customerPhone)}
      ${detailItem("Product", ticket.productName)}
      ${detailItem("Category", ticket.productCategory)}
      ${detailItem("Serial Number", ticket.serialNumber)}
      ${detailItem("Purchase Date", ticket.purchaseDate)}
      ${detailItem("Technician", ticket.technicianName || "Unassigned")}
      ${state.user.role === "admin" ? detailItem("Ticket Owner", `${ticket.ownerName} (${ticket.ownerEmail || "-"})`) : ""}
      ${detailItem("Created", formatDateTime(ticket.createdAt))}
      ${detailItem("Updated", formatDateTime(ticket.updatedAt))}
    </div>
    <div class="detail-item">
      <span>Issue Description</span>
      <strong>${escapeHtml(ticket.issueDescription)}</strong>
    </div>
    <section class="history-section">
      <h3>Activity History</h3>
      ${renderActivityLog(ticket.activityLog)}
    </section>
  `;
  elements.ticketModal.showModal();
}

function renderActivityLog(activityLog = []) {
  if (!Array.isArray(activityLog) || activityLog.length === 0) {
    return '<div class="empty-history">No activity recorded yet.</div>';
  }

  return `
    <div class="history-list">
      ${[...activityLog]
        .reverse()
        .map((entry) => {
          const summary =
            entry.action === "status_changed"
              ? `Status changed from ${entry.fromStatus} to ${entry.toStatus}`
              : entry.action === "created"
                ? "Ticket created"
                : "Ticket updated";

          return `
            <article class="history-item">
              <div>
                <strong>${escapeHtml(summary)}</strong>
                <p>${escapeHtml(entry.note || "")}</p>
              </div>
              <span>${escapeHtml(entry.actorName || "System")} | ${escapeHtml(formatDateTime(entry.timestamp))}</span>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function detailItem(label, value) {
  return `
    <div class="detail-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "-")}</strong>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetForm() {
  elements.form.reset();
  document.querySelector("#ticketId").value = "";
  elements.formTitle.textContent = "Create Ticket";
  elements.cancelEditButton.classList.add("hidden");
  setFormError("");
}

function editTicket(ticket) {
  document.querySelector("#ticketId").value = ticket.id;
  document.querySelector("#customerName").value = ticket.customerName;
  document.querySelector("#customerPhone").value = ticket.customerPhone;
  document.querySelector("#productName").value = ticket.productName;
  document.querySelector("#productCategory").value = ticket.productCategory;
  document.querySelector("#serialNumber").value = ticket.serialNumber;
  document.querySelector("#purchaseDate").value = ticket.purchaseDate;
  document.querySelector("#issueDescription").value = ticket.issueDescription;
  document.querySelector("#status").value = ticket.status;
  document.querySelector("#priority").value = ticket.priority;
  document.querySelector("#technicianId").value = ticket.technicianId || "";
  elements.formTitle.textContent = `Edit Ticket #${ticket.id}`;
  elements.cancelEditButton.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setFormError("");

  const id = document.querySelector("#ticketId").value;
  const data = getFormData();
  const validationError = validateForm(data);

  if (validationError) {
    setFormError(validationError);
    return;
  }

  try {
    if (id) {
      await request(`${api.tickets}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    } else {
      await request(api.tickets, {
        method: "POST",
        body: JSON.stringify(data)
      });
    }

    resetForm();
    await loadTickets();
  } catch (error) {
    setFormError(error.message);
  }
});

elements.ticketList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const ticket = state.tickets.find((item) => item.id === Number(button.dataset.id));
  if (!ticket) return;

  if (button.dataset.action === "details") {
    showTicketDetails(ticket);
  }

  if (button.dataset.action === "edit") {
    editTicket(ticket);
  }

  if (button.dataset.action === "delete") {
    const confirmed = confirm(`Delete ticket #${ticket.id} for ${ticket.customerName}?`);
    if (!confirmed) return;

    await request(`${api.tickets}/${ticket.id}`, { method: "DELETE" });
    await loadTickets();
  }
});

elements.ticketList.addEventListener("change", async (event) => {
  const select = event.target.closest('select[data-action="quick-status"]');
  if (!select) return;

  const ticket = state.tickets.find((item) => item.id === Number(select.dataset.id));
  if (!ticket || ticket.status === select.value) return;

  try {
    const statusNote = prompt("Status change note", `Status changed to ${select.value}.`);
    if (statusNote === null) {
      select.value = ticket.status;
      return;
    }

    await request(`${api.tickets}/${ticket.id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...ticket,
        status: select.value,
        statusNote,
        technicianId: ticket.technicianId || null
      })
    });
    await loadTickets();
  } catch (error) {
    setFormError(error.message);
    select.value = ticket.status;
  }
});

elements.cancelEditButton.addEventListener("click", resetForm);
elements.searchInput.addEventListener("input", loadTickets);
elements.statusFilter.addEventListener("change", loadTickets);
elements.priorityFilter.addEventListener("change", loadTickets);
elements.ownerFilter.addEventListener("change", loadTickets);
elements.closeModalButton.addEventListener("click", () => elements.ticketModal.close());
elements.logoutButton.addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  window.location.href = "/login.html";
});

async function init() {
  const user = JSON.parse(localStorage.getItem(userKey) || "{}");
  state.user = user;
  elements.userBadge.textContent = user.name
    ? `${user.name}${user.role === "admin" ? " - Admin" : ""}`
    : "Logged in";
  if (user.role === "admin") {
    elements.ownerFilterWrap.classList.remove("hidden");
    elements.usersLink.classList.remove("hidden");
  }
  await loadTechnicians();
  await loadTickets();
}

init().catch((error) => {
  elements.ticketList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});

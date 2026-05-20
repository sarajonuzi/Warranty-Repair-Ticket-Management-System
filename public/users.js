const tokenKey = "repairTicketToken";
const userKey = "repairTicketUser";
const token = localStorage.getItem(tokenKey);
const currentUser = JSON.parse(localStorage.getItem(userKey) || "{}");

if (!token) {
  window.location.href = "/login.html";
}

if (currentUser.role !== "admin") {
  window.location.href = "/";
}

const elements = {
  userBadge: document.querySelector("#userBadge"),
  logoutButton: document.querySelector("#logoutButton"),
  usersList: document.querySelector("#usersList"),
  usersError: document.querySelector("#usersError")
};

elements.userBadge.textContent = `${currentUser.name || "Admin"} - Admin`;

function setError(message) {
  elements.usersError.textContent = message || "";
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      window.location.href = "/login.html";
      return null;
    }

    throw new Error(data.message || "Request failed.");
  }

  return data;
}

async function loadUsers() {
  setError("");
  const users = await request("/api/users");
  renderUsers(users || []);
}

function renderUsers(users) {
  if (users.length === 0) {
    elements.usersList.innerHTML = '<div class="empty-state">No users found.</div>';
    return;
  }

  elements.usersList.innerHTML = users
    .map((user) => {
      const isCurrentUser = user.id === currentUser.id;
      const nextRole = user.role === "admin" ? "user" : "admin";
      const buttonLabel = user.role === "admin" ? "Make User" : "Make Admin";
      const disabled = isCurrentUser && user.role === "admin" ? "disabled" : "";

      return `
        <article class="user-card">
          <div>
            <h3>${escapeHtml(user.name)}</h3>
            <p>${escapeHtml(user.email)}</p>
          </div>
          <span class="role-badge ${user.role === "admin" ? "admin" : ""}">${escapeHtml(user.role)}</span>
          <button class="ghost" data-id="${user.id}" data-role="${nextRole}" type="button" ${disabled}>
            ${buttonLabel}
          </button>
        </article>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

elements.usersList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;

  try {
    await request(`/api/users/${button.dataset.id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: button.dataset.role })
    });
    await loadUsers();
  } catch (error) {
    setError(error.message);
  }
});

elements.logoutButton.addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  window.location.href = "/login.html";
});

loadUsers().catch((error) => setError(error.message));

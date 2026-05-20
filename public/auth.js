const tokenKey = "repairTicketToken";
const userKey = "repairTicketUser";

function setAuthError(message) {
  document.querySelector("#authError").textContent = message || "";
}

async function authRequest(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Authentication failed.");
  }

  localStorage.setItem(tokenKey, data.token);
  localStorage.setItem(userKey, JSON.stringify(data.user));
  window.location.href = "/";
}

const loginForm = document.querySelector("#loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthError("");

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;

    if (!email || password.length < 6) {
      setAuthError("Email and password are required.");
      return;
    }

    try {
      await authRequest("/api/auth/login", { email, password });
    } catch (error) {
      setAuthError(error.message);
    }
  });
}

const registerForm = document.querySelector("#registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthError("");

    const name = document.querySelector("#name").value.trim();
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;

    if (name.length < 2 || !email || password.length < 6) {
      setAuthError("Name, valid email and a 6 character password are required.");
      return;
    }

    try {
      await authRequest("/api/auth/register", { name, email, password });
    } catch (error) {
      setAuthError(error.message);
    }
  });
}

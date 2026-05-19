// assets/js/login.js

import { api } from "./api.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("loginRole").value;

  const btn = e.submitter || document.querySelector("#loginBtn");
  const originalText = btn.textContent;
  btn.textContent = "Logging in...";
  btn.disabled = true;

  // clear previous error
  const errMsg = document.getElementById("loginError");
  if (errMsg) {
    errMsg.textContent = "";
    errMsg.classList.add("hidden");
  }

  try {
    // Try backend login first
    const res = await api("/auth/login", "POST", {
      email,
      password,
      role,
    });

    // Store auth data
    res.user.id = res.user._id;
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));

    // Role-based redirect
    if (role === "supplier") {
      window.location.href = "supplier_home.html";
    } else {
      window.location.href = "home.html";
    }

  } catch (err) {
    btn.textContent = originalText;
    btn.disabled = false;

    // Show error
    const errMsg2 = document.getElementById("loginError");
    if (errMsg2) {
      errMsg2.textContent = err.message || "Login failed. Please check your credentials.";
      errMsg2.classList.remove("hidden");
    }
  }
});

// clear error when the user types
["email", "password", "loginRole"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", () => {
      const errMsg = document.getElementById("loginError");
      if (errMsg) {
        errMsg.textContent = "";
        errMsg.classList.add("hidden");
      }
    });
  }
});

// Check if user is already logged in
document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const roleInput = document.getElementById("loginRole");

  if (emailInput) {
    emailInput.value = "";
    emailInput.setAttribute("autocomplete", "username");
  }
  if (passwordInput) {
    passwordInput.value = "";
    passwordInput.setAttribute("autocomplete", "new-password");
  }
  if (roleInput) {
    roleInput.value = "vendor";
  }

  const currentUser = JSON.parse(localStorage.getItem("user"));
  if (currentUser) {
    if (currentUser.role === "supplier") {
      window.location.href = "supplier_dashboard.html";
    } else {
      window.location.href = "home.html";
    }
  }
});

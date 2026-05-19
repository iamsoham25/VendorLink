// assets/js/signup.js
import { api } from "./api.js";

const form = document.getElementById("signupForm");
const roleSelect = document.getElementById("role");
const vendorFields = document.getElementById("vendorFields");

console.log("✅ Signup.js loaded successfully");

// Toggle vendor fields based on role selection
roleSelect.addEventListener("change", (e) => {
  console.log("Role changed to:", e.target.value);
  if (e.target.value === "vendor") {
    vendorFields.classList.remove("hidden");
  } else {
    vendorFields.classList.add("hidden");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("📝 Form submitted!");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  console.log("Form data:", { name, email, role });

  const payload = { name, email, password, role };

  // Add vendor-specific fields if role is vendor
  if (role === "vendor") {
    payload.vendorName = document.getElementById("shopName").value.trim();
    payload.category = document.getElementById("category").value.trim();
    payload.location = document.getElementById("location").value.trim();
    payload.contact = document.getElementById("contact").value.trim();

    console.log("Vendor fields:", { vendorName: payload.vendorName, category: payload.category, location: payload.location, contact: payload.contact });

    // Validate vendor fields
    if (!payload.vendorName || !payload.category || !payload.location || !payload.contact) {
      const errorMsg = "Please fill in all vendor details";
      console.error("❌", errorMsg);
      alert(errorMsg);
      return;
    }
  }

  console.log("📤 Sending payload to /auth/signup:", JSON.stringify(payload, null, 2));

  try {
    const response = await api("/auth/signup", "POST", payload);
    console.log("✅ Signup successful! Response:", response);
    alert("Signup successful! Please log in.");
    window.location.href = "login.html";
  } catch (err) {
    console.error("❌ Signup error:", err);
    console.error("Error message:", err.message);
    alert("Error: " + err.message);
  }
});

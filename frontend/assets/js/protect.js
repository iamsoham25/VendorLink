// assets/js/protect.js

// Helper to verify JWT expiration (returns false if invalid/expired)
function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function requireSupplier() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token || !isTokenValid(token)) {
    // clear any stale data
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    alert("Please login as Supplier first.");
    window.location.href = "login.html";
    return null;
  }

  if (user.role !== "supplier") {
    alert("Only suppliers can access this page.");
    window.location.href = "index.html";
    return null;
  }

  return user;
}

export function requireVendor() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    alert("Please login as Vendor first.");
    window.location.href = "login.html";
    return null;
  }

  if (user.role !== "vendor") {
    alert("Vendors only page.");
    window.location.href = "index.html";
    return null;
  }

  return user;
}

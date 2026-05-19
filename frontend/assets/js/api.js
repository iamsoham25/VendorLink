// assets/js/api.js

// Dynamically detect API base so it works on any port
export const API_BASE = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api`;

console.log("🌐 API_BASE configured as:", API_BASE);

export async function api(endpoint, method = "GET", body = null, auth = false) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE}${cleanEndpoint}`;
  
  console.log(`📡 [API] ${method} ${fullUrl}`);
  console.log(`📦 Headers:`, headers);
  if (body) {
    console.log(`📦 Body:`, body);
  }

  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    console.log(`📥 Response Status: ${res.status} ${res.statusText}`);

    const data = await res.json();
    console.log(`📥 Response Body:`, data);

    if (!res.ok) {
      // If 401 Unauthorized, token is expired or invalid — clear session and redirect to login
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Your session has expired. Please log in again.");
        window.location.href = "/login.html";
        return;
      }
      const errorMsg = data.error || data.message || "Request failed";
      console.error(`❌ API Error: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`❌ API Exception:`, error);
    throw error;
  }
}

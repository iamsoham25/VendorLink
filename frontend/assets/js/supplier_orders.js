// assets/js/supplier_orders.js
const API_BASE = "http://localhost:5000/api";

const totalOrdersEl = document.getElementById("totalOrders");
const pendingOrdersEl = document.getElementById("pendingOrders");
const totalRevenueEl = document.getElementById("totalRevenue");
const ordersTableBody = document.getElementById("ordersTableBody");
const noOrdersMsg = document.getElementById("noOrdersMsg");

let authUser = null;
let token = null;

function getAuth() {
  try {
    authUser = JSON.parse(localStorage.getItem("vendorlink_user"));
    token = authUser?.token || localStorage.getItem("vendorlink_token");
  } catch {
    authUser = null;
  }
}

function requireSupplier() {
  getAuth();
  if (!authUser || authUser.role !== "supplier") {
    alert("Please login as a supplier to view this page.");
    window.location.href = "login.html";
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function computeSummary(orders) {
  totalOrdersEl.textContent = orders.length;

  const pending = orders.filter(o => o.status === "Pending").length;
  pendingOrdersEl.textContent = pending;

  const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  totalRevenueEl.textContent = revenue.toFixed(2);
}

function renderOrders(orders) {
  ordersTableBody.innerHTML = "";

  if (!orders.length) {
    noOrdersMsg.classList.remove("hidden");
    return;
  }
  noOrdersMsg.classList.add("hidden");

  orders.forEach(order => {
    const row = document.createElement("tr");
    row.className = "border-t border-gray-100 dark:border-gray-700";

    const itemsText = order.items
      .map(i => `${i.name} x${i.quantity}`)
      .join(", ");

    row.innerHTML = `
      <td class="py-2 pr-4 align-top text-xs md:text-sm">#${order._id.slice(-6)}</td>
      <td class="py-2 pr-4 align-top text-xs md:text-sm">
        ${order.vendorId?.name || "Unknown"}
        <div class="text-[0.7rem] text-gray-500">${order.vendorId?.email || ""}</div>
      </td>
      <td class="py-2 pr-4 align-top text-xs md:text-sm">${itemsText}</td>
      <td class="py-2 pr-4 align-top font-semibold text-emerald-600 text-xs md:text-sm">
        ₹${order.totalAmount.toFixed(2)}
      </td>
      <td class="py-2 pr-4 align-top text-xs md:text-sm">
        <select data-order-id="${order._id}"
                class="status-select px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs">
          ${["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
            .map(
              s =>
                `<option value="${s}" ${order.status === s ? "selected" : ""}>${s}</option>`
            )
            .join("")}
        </select>
      </td>
      <td class="py-2 pr-4 align-top text-xs md:text-sm">
        ${formatDate(order.createdAt)}
      </td>
    `;

    ordersTableBody.appendChild(row);
  });

  // Attach change listeners to all status dropdowns
  document.querySelectorAll(".status-select").forEach(select => {
    select.addEventListener("change", async e => {
      const orderId = e.target.getAttribute("data-order-id");
      const newStatus = e.target.value;
      await updateOrderStatus(orderId, newStatus);
    });
  });
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to update status");
      return;
    }

    // Reload orders after status change
    await loadOrders();
  } catch (err) {
    console.error(err);
    alert("Error updating order status");
  }
}

async function loadOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders/supplier`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const orders = await res.json();

    if (!res.ok) {
      console.error(orders);
      alert(orders.message || "Failed to fetch orders");
      return;
    }

    computeSummary(orders);
    renderOrders(orders);
  } catch (err) {
    console.error(err);
    alert("Error loading orders");
  }
}

// Init
requireSupplier();
loadOrders();

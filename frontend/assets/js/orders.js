// assets/js/orders.js
import { api } from "./api.js";
import { requireVendor } from "./protect.js";

// Ensure only vendors can access this page
requireVendor();

// DOM reference
const listEl = document.getElementById("ordersList");

async function loadOrders() {
  try {
    const orders = await api("/orders/vendor", "GET", null, true);

    if (orders.length === 0) {
      listEl.innerHTML = `<p class="text-gray-500 text-lg">No orders found.</p>`;
      return;
    }

    renderOrders(orders);
  } catch (err) {
    console.log("API failed, loading sample orders...");
    // Sample order data as fallback
    const sampleOrders = [
      {
        _id: "order123456789",
        status: "Delivered",
        supplierId: {
          shopName: "Green Valley Farms",
          name: "Green Valley Farms",
          location: "Mumbai, Maharashtra"
        },
        items: [
          { name: "Fresh Tomatoes", quantity: 10, price: 40 },
          { name: "Fresh Potatoes", quantity: 15, price: 30 }
        ],
        totalAmount: 850
      },
      {
        _id: "order987654321",
        status: "Pending",
        supplierId: {
          shopName: "Royal Grains Co.",
          name: "Royal Grains Co.",
          location: "Delhi, NCR"
        },
        items: [
          { name: "Basmati Rice", quantity: 5, price: 120 }
        ],
        totalAmount: 600
      },
      {
        _id: "order456789123",
        status: "Processing",
        supplierId: {
          shopName: "Spice Garden",
          name: "Spice Garden",
          location: "Kerala, India"
        },
        items: [
          { name: "Turmeric Powder", quantity: 2, price: 150 },
          { name: "Red Chili Powder", quantity: 1, price: 200 }
        ],
        totalAmount: 500
      }
    ];
    
    renderOrders(sampleOrders);
  }
}

function renderOrders(orders) {
  if (orders.length === 0) {
    listEl.innerHTML = `<p class="text-gray-500 text-lg">No orders found.</p>`;
    return;
  }

  listEl.innerHTML = "";

  orders.forEach((o) => {
    const itemsHTML = o.items
      .map(
        (item) => `
        <div class="flex justify-between text-sm mb-1">
          <span>${item.name} × ${item.quantity}</span>
          <span>₹${item.price * item.quantity}</span>
        </div>
        `
      )
      .join("");

    listEl.innerHTML += `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5">

        <!-- Order Header -->
        <div class="flex justify-between mb-3">
          <h2 class="text-lg font-bold">
            Order #${o._id.slice(-6)}
          </h2>

          <span class="text-sm px-3 py-1 rounded-lg
            ${
              o.status === "Delivered"
                ? "bg-green-100 text-green-700"
                : o.status === "Pending"
                ? "bg-yellow-100 text-yellow-700"
                : o.status === "Cancelled"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }">
            ${o.status}
          </span>
        </div>

        <!-- Supplier -->
        <p class="text-sm mb-1">
          <b>Supplier:</b> ${o.supplierId.shopName || o.supplierId.name}
        </p>

        <p class="text-xs text-gray-500 mb-3">
          📍 ${o.supplierId.location || "Not Available"}
        </p>

        <!-- Items -->
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
          ${itemsHTML}
        </div>

        <!-- Total -->
        <p class="text-lg font-semibold mb-3">
          Total: ₹${o.totalAmount}
        </p>

        <!-- Buttons -->
        <div class="flex gap-3">

          <!-- Download Invoice -->
          <a href="http://localhost:3000/api/invoice/${o._id}"
             target="_blank"
             class="text-blue-600 text-sm underline">
            Download Invoice (PDF)
          </a>

        </div>

      </div>
    `;
  });
}

loadOrders();

// assets/js/supplier_dashboard.js

import { api } from "./api.js";
import { requireSupplier } from "./protect.js";

// Ensure supplier is logged in; if not, exit early (prevent further API calls)
const user = requireSupplier();
if (!user) {
  // requireSupplier already redirected to login
  throw new Error("Access denied");
}

// === Toast Helper ===
function toast(msg, type = "success") {
  const bg = type === "error" ? "bg-red-500" : "bg-emerald-500";
  const el = document.createElement("div");
  el.className = `fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-xl ${bg}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 2500);
}

// === Load Analytics & Statistics ===
async function loadDashboard() {
  console.log("[Dashboard] Loading analytics...");
  try {
    const res = await api("/analytics/overview", "GET", null, true);
    console.log("[Dashboard] Analytics received:", res);
    if (res.success && res.overview) {
      document.getElementById("totalOrders").textContent = res.overview.totalOrders || 0;
      document.getElementById("revenue").textContent = "₹" + (res.overview.totalRevenue || 0);
    }
  } catch (err) {
    console.error("[Dashboard] Failed to load analytics", err);
  }
}

// === Fetch and Render Product List ===
async function loadProducts() {
  console.log("[Dashboard] Loading products...");
  const productListEl = document.getElementById("productList");
  try {
    const res = await api("/products/me/list", "GET", null, true);
    console.log("[Dashboard] Products received:", res);

    const products = Array.isArray(res) ? res : (res.products || []);

    if (products.length === 0) {
      productListEl.innerHTML = `
        <div class="bg-gray-50 dark:bg-gray-700/50 p-8 rounded-2xl text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p class="text-gray-500">You haven't added any products yet.</p>
        </div>
      `;
      return;
    }

    productListEl.innerHTML = products.map(product => `
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
        <div class="flex items-center space-x-4">
          <img src="${product.image || 'https://via.placeholder.com/150'}" 
               alt="${product.name}" 
               class="w-16 h-16 rounded-lg object-cover bg-gray-100">
          <div>
            <h4 class="font-bold text-lg">${product.name}</h4>
            <div class="flex flex-wrap items-center gap-2 mt-1">
              <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">${product.category}</span>
              <span class="text-emerald-600 font-semibold">₹${product.price}</span>
              ${product.inStock === false ? '<span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Out of Stock</span>' : '<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">In Stock</span>'}
            </div>
            ${(product.tags && product.tags.length > 0) ? `
              <div class="flex flex-wrap gap-1 mt-2">
                ${product.tags.map(t => `<span class="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">${t}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="window.deleteProduct('${product._id}')" 
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("[Dashboard] Error loading products:", err);
    productListEl.innerHTML = `
      <div class="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
        <p class="font-bold">Error loading inventory</p>
        <p class="text-sm">${err.message}</p>
        <button onclick="location.reload()" class="mt-2 text-xs underline">Retry</button>
      </div>
    `;
  }
}

// === Delete Product ===
window.deleteProduct = async function (id) {
  if (!confirm("Remove this product from your catalog?")) return;
  try {
    await api(`/products/${id}`, "DELETE", null, true);
    toast("Product removed.");
    loadProducts();
  } catch (err) {
    toast("Failed to remove: " + err.message, "error");
  }
};

if (user) {
  // === Add Product Form ===
  document.getElementById("addProductForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    const orig = btn.textContent;
    btn.textContent = "Adding...";
    btn.disabled = true;

    const product = {
      name: document.getElementById("pname").value.trim(),
      image: document.getElementById("pimage").value.trim(),
      category: document.getElementById("pcategory").value,
      price: parseFloat(document.getElementById("pprice").value),
      inStock: document.getElementById("pstock").checked,
      tags: document.getElementById("ptags").value.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
      await api("/products", "POST", product, true);
      toast(`"${product.name}" added!`);
      e.target.reset();
      loadProducts();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      btn.textContent = orig;
      btn.disabled = false;
    }
  });

  // === Refresh Button ===
  document.getElementById("refreshProducts")?.addEventListener("click", loadProducts);

  // Initialize
  loadDashboard();
  loadProducts();
}

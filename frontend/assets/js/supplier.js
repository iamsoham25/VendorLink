// assets/js/suppliers.js
import { api } from "./api.js";

let allSuppliers = [];
let filteredSuppliers = [];

// DOM Elements
const listEl = document.getElementById("suppliersList");
const searchEl = document.getElementById("supplierSearch");
const categoryChipsEl = document.getElementById("categoryChips");
const locationFilterEl = document.getElementById("locationFilter");
const ratingFilterEl = document.getElementById("ratingFilter");
const resetFiltersEl = document.getElementById("resetFilters");

function renderSuppliers(list) {
  listEl.innerHTML = "";

  if (list.length === 0) {
    listEl.innerHTML = `<p class="text-gray-500">No suppliers found.</p>`;
    return;
  }

  list.forEach((s) => {
    listEl.innerHTML += `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">

        <!-- Supplier Image -->
        <img src="${s.photo || 
          "https://cdn-icons-png.flaticon.com/512/149/149071.png"}"
          class="h-40 w-full object-cover rounded-lg mb-3">

        <!-- Supplier Name -->
        <h2 class="text-lg font-bold">${s.shopName || s.name}</h2>

        <p class="text-sm text-gray-500">${s.category}</p>
        <p class="text-sm text-gray-600 mt-1">📍 ${s.location}</p>

        <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg mt-2 inline-block">
          ★ ${s.rating || 4.2}
          ${s.rating >= 4.5 ? " • Verified" : ""}
        </span>

        <button
          onclick="window.location.href='supplier_profile.html?id=${s._id}'"
          class="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg">
          Contact Supplier
        </button>

      </div>
    `;
  });
}

// Main filter function
function applyFilters() {
  let list = [...allSuppliers];

  // Search
  const q = searchEl.value.toLowerCase();
  if (q) {
    list = list.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.shopName.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }

  // Category Chips
  const activeChip = categoryChipsEl.querySelector(".filter-chip.active");
  const selectedCategory = activeChip?.dataset.category;

  if (selectedCategory && selectedCategory !== "all") {
    list = list.filter((s) => s.category === selectedCategory);
  }

  // Location
  const loc = locationFilterEl.value;
  if (loc) {
    list = list.filter((s) => s.location === loc);
  }

  // Ratings
  const minRating = parseFloat(ratingFilterEl.value);
  if (minRating) {
    list = list.filter((s) => s.rating >= minRating);
  }

  filteredSuppliers = list;
  renderSuppliers(list);
}

// Add event listeners
searchEl.addEventListener("input", applyFilters);
locationFilterEl.addEventListener("change", applyFilters);
ratingFilterEl.addEventListener("change", applyFilters);

categoryChipsEl.addEventListener("click", (e) => {
  if (!e.target.classList.contains("filter-chip")) return;

  categoryChipsEl.querySelectorAll(".filter-chip")
    .forEach((c) => c.classList.remove("active"));

  e.target.classList.add("active");

  applyFilters();
});

resetFiltersEl.addEventListener("click", () => {
  searchEl.value = "";
  ratingFilterEl.value = "";
  locationFilterEl.value = "";

  categoryChipsEl.querySelectorAll(".filter-chip")
    .forEach((c) => c.classList.remove("active"));

  categoryChipsEl.querySelector("[data-category='all']").classList.add("active");

  applyFilters();
});

// Load suppliers from backend
async function loadSuppliers() {
  try {
    const suppliers = await api("/auth/all-suppliers", "GET");

    allSuppliers = suppliers.map((s) => ({
      _id: s._id,
      name: s.name,
      shopName: s.shopName || s.name,
      category: s.category || "General",
      location: s.location || "Unknown",
      contactNumber: s.contactNumber || "",
      photo: s.photo || "",
      rating: s.rating || 4.3,
    }));

    // Populate location dropdown
    const locations = [...new Set(allSuppliers.map((s) => s.location))];
    locations.forEach((loc) => {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      locationFilterEl.appendChild(opt);
    });

    filteredSuppliers = [...allSuppliers];
    renderSuppliers(filteredSuppliers);

  } catch (err) {
    listEl.innerHTML = `<p class="text-red-500">Error loading suppliers.</p>`;
  }
}

loadSuppliers();

/*
  assets/js/marketplace-simple.js

  This script powers the Vendor "Marketplace" page (frontend/marketplace.html).
  It loads products from the backend API (/api/products) and renders them with
  filters (category, price, supplier, rating, tags).
*/

console.log("📦 marketplace.js script loaded successfully!");

// Product state loaded from backend
let allProducts = [];
// Add to cart function
window.addToCart = function (name, price, supplierId) {
  console.log("🛒 Adding to cart:", { name, price, supplierId });

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  // Check if item already exists in cart
  const existingItem = cart.find(item => item.name === name && item.supplierId === supplierId);

  if (existingItem) {
    existingItem.qty += 1;
    showNotification(`${name} quantity updated in cart!`, "success");
  } else {
    cart.push({
      name,
      price,
      qty: 1,
      supplierId,
      timestamp: new Date().toISOString()
    });
    showNotification(`${name} added to cart!`, "success");
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
};

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 ${type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;

  notification.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' :
      type === 'error' ? 'fa-exclamation-circle' :
        'fa-info-circle'
    } text-xl"></i>
    <div>
      <div class="font-semibold">${type === 'success' ? 'Success!' :
      type === 'error' ? 'Error!' :
        'Info'
    }</div>
      <div class="text-sm">${message}</div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Update cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // Update cart link if it exists
  const cartLink = document.getElementById('cartLink');
  if (cartLink) {
    const link = cartLink.querySelector('a');
    if (link) {
      link.innerHTML = `Cart (${totalItems})`;
    }
  }
}

// Filter state
const filters = {
  search: "",
  category: "all",
  minPrice: null,
  maxPrice: null,
  supplier: "",
  minRating: null,
  inStockOnly: false,
  tags: [],
  sortBy: ""
};

// Populate suppliers
function populateSuppliers() {
  const supplierSelect = document.getElementById("supplierSelect");
  if (!supplierSelect) return;

  // Clear existing options except the first one
  supplierSelect.innerHTML = '<option value="">All suppliers</option>';

  const suppliers = new Set(allProducts.map(p => p.supplierName));
  suppliers.forEach(supp => {
    const option = document.createElement("option");
    option.value = supp;
    option.textContent = supp;
    supplierSelect.appendChild(option);
  });
}

// Apply filters
function applyFilters() {
  let filtered = allProducts.filter(p => {
    // Search
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;

    // Category
    if (filters.category !== "all" && p.category !== filters.category) return false;

    // Price
    if (filters.minPrice !== null && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && p.price > filters.maxPrice) return false;

    // Supplier
    if (filters.supplier && p.supplierName !== filters.supplier) return false;

    // Rating
    if (filters.minRating !== null && p.rating < filters.minRating) return false;

    // In Stock
    if (filters.inStockOnly && !p.inStock) return false;

    // Tags
    if (filters.tags.length > 0) {
      // Must have all selected tags
      const hasAllTags = filters.tags.every(tag =>
        (p.tags || []).map(t => t.toLowerCase()).includes(tag.toLowerCase())
      );
      if (!hasAllTags) return false;
    }

    return true;
  });

  // Sort
  if (filters.sortBy === "low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === "high") {
    filtered.sort((a, b) => b.price - a.price);
  }

  renderProducts(filtered);
}

// Initialize filters
function initFilters() {
  populateSuppliers();

  // Search
  document.getElementById("searchBar")?.addEventListener("input", (e) => {
    filters.search = e.target.value;
    applyFilters();
  });

  // Category Chips
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      e.target.classList.add("active");
      filters.category = e.target.dataset.category || "all";
      applyFilters();
    });
  });

  // Price
  document.getElementById("priceMin")?.addEventListener("input", (e) => {
    filters.minPrice = e.target.value ? Number(e.target.value) : null;
    applyFilters();
  });
  document.getElementById("priceMax")?.addEventListener("input", (e) => {
    filters.maxPrice = e.target.value ? Number(e.target.value) : null;
    applyFilters();
  });

  // Supplier
  document.getElementById("supplierSelect")?.addEventListener("change", (e) => {
    filters.supplier = e.target.value;
    applyFilters();
  });

  // Rating
  document.getElementById("ratingSelect")?.addEventListener("change", (e) => {
    filters.minRating = e.target.value ? Number(e.target.value) : null;
    applyFilters();
  });

  // In Stock
  document.getElementById("inStockOnly")?.addEventListener("change", (e) => {
    filters.inStockOnly = e.target.checked;
    applyFilters();
  });

  // Tags
  document.querySelectorAll(".tagFilterInput").forEach(input => {
    input.addEventListener("change", () => {
      const selectedTags = Array.from(document.querySelectorAll(".tagFilterInput:checked")).map(i => i.value);
      filters.tags = selectedTags;
      applyFilters();
    });
  });

  // Sort By
  document.getElementById("sortSelect")?.addEventListener("change", (e) => {
    filters.sortBy = e.target.value;
    applyFilters();
  });

  // Clear Filters
  document.getElementById("clearFilters")?.addEventListener("click", () => {
    // Reset state
    filters.search = "";
    filters.category = "all";
    filters.minPrice = null;
    filters.maxPrice = null;
    filters.supplier = "";
    filters.minRating = null;
    filters.inStockOnly = false;
    filters.tags = [];
    filters.sortBy = "";

    // Reset DOM
    if (document.getElementById("searchBar")) document.getElementById("searchBar").value = "";
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    document.querySelector('.filter-chip[data-category="all"]')?.classList.add("active");
    if (document.getElementById("priceMin")) document.getElementById("priceMin").value = "";
    if (document.getElementById("priceMax")) document.getElementById("priceMax").value = "";
    if (document.getElementById("supplierSelect")) document.getElementById("supplierSelect").value = "";
    if (document.getElementById("ratingSelect")) document.getElementById("ratingSelect").value = "";
    if (document.getElementById("inStockOnly")) document.getElementById("inStockOnly").checked = false;
    document.querySelectorAll(".tagFilterInput").forEach(i => i.checked = false);
    if (document.getElementById("sortSelect")) document.getElementById("sortSelect").value = "";

    applyFilters();
  });
}

// Render products
function renderProducts(productsToRender = allProducts) {
  console.log("🎨 Rendering products...");

  const productListEl = document.getElementById("productList");
  if (!productListEl) {
    console.error("❌ Product list element not found!");
    return;
  }

  productListEl.innerHTML = "";

  if (productsToRender.length === 0) {
    productListEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6b7280;">
        <p>No products found matching your filters.</p>
      </div>
    `;
    return;
  }

  productsToRender.forEach((p) => {
    const tags = (p.tags || [])
      .map((t) => `<span class="tag-pill">${t}</span>`)
      .join("");

    productListEl.innerHTML += `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all duration-300 p-4 flex flex-col">
        
        <img src="${p.image}" class="rounded-xl h-40 w-full object-cover mb-4">

        <div class="flex justify-between items-start mb-2">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">${p.name}</h2>
          <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg">
            ★ ${p.rating}
          </span>
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">${p.category}</p>

        <p class="text-xl font-bold text-amber-600 mb-2">₹${p.price}/kg</p>

        <div class="mb-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Supplier: ${p.supplierName}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            <i class="fas fa-map-marker-alt mr-1"></i>${p.supplierLocation}
          </p>
        </div>

        <span class="badge-stock ${p.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"} mb-2">
          ${p.inStock ? "✓ In Stock" : "✗ Out of Stock"}
        </span>

        <div class="mb-3">${tags}</div>

        <button
          onclick="addToCart('${p.name}', ${p.price}, '${p.supplierId}')"
          class="mt-auto w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
          <i class="fas fa-cart-plus mr-2"></i>Add to Cart
        </button>
      </div>
    `;
  });

  console.log("✅ Products rendered successfully!");
}

// Initialize marketplace
async function loadProducts() {
  console.log("📡 Loading products from backend...");

  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
    const data = await res.json();

    // Backend returns an array for /api/products, and some endpoints return { products: [] }
    const products = Array.isArray(data) ? data : data.products || [];

    allProducts = products.map((p) => {
      const supplier = p.supplier || {};
      return {
        _id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        image: p.image || supplier.image || "https://cdn-icons-png.flaticon.com/512/3081/3081559.png",
        supplierName: supplier.shopName || supplier.name || supplier.email || "Unknown Supplier",
        supplierId: supplier._id || "",
        supplierLocation: supplier.location || "",
        supplierPhone: supplier.contactNumber || "",
        rating: p.rating || supplier.rating || 0,
        inStock: p.inStock !== false,
        tags: p.tags || [],
      };
    });

    populateSuppliers();
    applyFilters();
    updateCartCount();
  } catch (err) {
    console.error(err);
    const productListEl = document.getElementById("productList");
    if (productListEl) {
      productListEl.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6b7280;"><p>Unable to load products at this time.</p></div>`;
    }
  }
}

function initMarketplace() {
  console.log("🚀 Initializing marketplace...");

  // Wait a bit for DOM to be ready
  setTimeout(() => {
    initFilters();
    loadProducts();
  }, 100);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMarketplace);
} else {
  initMarketplace();
}

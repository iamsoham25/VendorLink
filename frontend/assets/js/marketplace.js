// assets/js/marketplace.js
console.log("📦 marketplace.js script loaded successfully!");

// DOM Elements - will be initialized after DOM loads
let productListEl;
let searchBarEl;
let categoryChipsEl;
let priceMinEl;
let priceMaxEl;
let supplierSelectEl;
let ratingSelectEl;
let inStockOnlyEl;
let sortSelectEl;
let clearFiltersEl;
let tagFilterInputs;

let allProducts = [];
let filteredProducts = [];
let currentUser = null;

// Initialize DOM elements
function initializeDOMElements() {
  console.log("🔍 Initializing DOM elements...");
  productListEl = document.getElementById("productList");
  searchBarEl = document.getElementById("searchBar");
  categoryChipsEl = document.getElementById("categoryChips");
  priceMinEl = document.getElementById("priceMin");
  priceMaxEl = document.getElementById("priceMax");
  supplierSelectEl = document.getElementById("supplierSelect");
  ratingSelectEl = document.getElementById("ratingSelect");
  inStockOnlyEl = document.getElementById("inStockOnly");
  sortSelectEl = document.getElementById("sortSelect");
  clearFiltersEl = document.getElementById("clearFilters");
  tagFilterInputs = document.querySelectorAll(".tagFilterInput");

  console.log("🔍 DOM elements initialized:");
  console.log("  - productListEl:", productListEl);
  console.log("  - searchBarEl:", searchBarEl);
  console.log("  - categoryChipsEl:", categoryChipsEl);
}

// Check user role and load appropriate content
function checkUserRoleAndLoadContent() {
  currentUser = JSON.parse(localStorage.getItem("user")) || { role: "vendor" };

  // Update page text based on role
  updatePageForRole();

  // Load products for vendors, requirements for suppliers
  if (currentUser.role === "supplier") {
    loadRequirements();
  } else {
    loadProducts();
  }
}

// Update page elements based on user role
function updatePageForRole() {
  const pageTitle = document.querySelector('h1');
  const pageSubtitle = document.querySelector('p.text-gray-600');

  if (currentUser.role === 'vendor') {
    pageTitle.textContent = 'Find Suppliers';
    pageSubtitle.textContent = 'Discover reliable suppliers for your raw material needs';

    // Update search placeholder
    if (searchBarEl) {
      searchBarEl.placeholder = 'Search suppliers by name or material...';
    }
  } else if (currentUser.role === 'supplier') {
    pageTitle.textContent = 'Vendor Requirements';
    pageSubtitle.textContent = 'Find vendors who need your materials';

    // Update search placeholder
    if (searchBarEl) {
      searchBarEl.placeholder = 'Search requirements by material or location...';
    }
  }
}

// Load suppliers for vendors
async function loadSuppliers() {
  try {
    // Mock supplier data
    const mockSuppliers = [
      {
        _id: 'supplier_1',
        name: 'Steel Industries Ltd',
        businessType: 'manufacturer',
        location: 'Mumbai, Maharashtra',
        materials: ['Steel Rods', 'Steel Pipes', 'Steel Sheets'],
        capacity: '1000 tons/month',
        rating: 4.5,
        verified: true,
        image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
        contactNumber: '+91 9876543210',
        email: 'info@steelindustries.com'
      },
      {
        _id: 'supplier_2',
        name: 'Cement Suppliers Co',
        businessType: 'distributor',
        location: 'Delhi, NCR',
        materials: ['Portland Cement', 'White Cement', 'Ready Mix Concrete'],
        capacity: '500 tons/month',
        rating: 4.2,
        verified: true,
        image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
        contactNumber: '+91 9876543211',
        email: 'contact@cementsuppliers.com'
      },
      {
        _id: 'supplier_3',
        name: 'Chemical Solutions',
        businessType: 'manufacturer',
        location: 'Chennai, Tamil Nadu',
        materials: ['Industrial Chemicals', 'Solvents', 'Acids'],
        capacity: '200 tons/month',
        rating: 4.0,
        verified: false,
        image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
        contactNumber: '+91 9876543212',
        email: 'info@chemicalsolutions.com'
      }
    ];

    allProducts = mockSuppliers;
    filteredProducts = [...mockSuppliers];
    renderSuppliers(filteredProducts);

  } catch (error) {
    console.error('Failed to load suppliers:', error);
    productListEl.innerHTML = `<p class="text-red-500">Failed to load suppliers.</p>`;
  }
}

// Load requirements for suppliers
async function loadRequirements() {
  try {
    // Mock requirement data
    const mockRequirements = [
      {
        _id: 'req_1',
        vendorName: 'Construction Pro Ltd',
        vendorLocation: 'Bangalore, Karnataka',
        material: 'Steel Rods',
        quantity: '500 kg',
        requiredBy: '2024-03-15',
        budget: '₹50,000',
        description: 'Need high-quality steel rods for residential construction project',
        urgent: true,
        postedDate: '2024-02-26',
        image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
        vendorId: 'vendor_1'
      },
      {
        _id: 'req_2',
        vendorName: 'BuildTech Solutions',
        vendorLocation: 'Pune, Maharashtra',
        material: 'Portland Cement',
        quantity: '1000 bags',
        requiredBy: '2024-03-20',
        budget: '₹40,000',
        description: 'Require cement for commercial building project',
        urgent: false,
        postedDate: '2024-02-25',
        image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
        vendorId: 'vendor_2'
      },
      {
        _id: 'req_3',
        vendorName: 'Infrastructure Developers',
        vendorLocation: 'Hyderabad, Telangana',
        material: 'Industrial Chemicals',
        quantity: '200 liters',
        requiredBy: '2024-03-10',
        budget: '₹25,000',
        description: 'Need specific industrial chemicals for manufacturing process',
        urgent: true,
        postedDate: '2024-02-24',
        image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
        vendorId: 'vendor_3'
      }
    ];

    allProducts = mockRequirements;
    filteredProducts = [...mockRequirements];
    renderRequirements(filteredProducts);

  } catch (error) {
    console.error('Failed to load requirements:', error);
    productListEl.innerHTML = `<p class="text-red-500">Failed to load requirements.</p>`;
  }
}

// Render suppliers (for vendors)
function renderSuppliers(list) {
  productListEl.innerHTML = "";

  if (!list.length) {
    productListEl.innerHTML = `<p class="text-sm text-gray-500">No suppliers found.</p>`;
    return;
  }

  list.forEach((supplier) => {
    const materials = supplier.materials.map(m => `<span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">${m}</span>`).join(' ');

    productListEl.innerHTML += `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col">
        
        <div class="flex items-start justify-between mb-4">
          <img src="${supplier.image}" class="rounded-xl h-16 w-16 object-cover">
          <div class="flex items-center space-x-2">
            ${supplier.verified ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg"><i class="fas fa-check-circle mr-1"></i>Verified</span>' : ''}
            <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg">
              ★ ${supplier.rating}
            </span>
          </div>
        </div>

        <div class="flex justify-between items-start mb-2">
          <h2 class="text-lg font-semibold">${supplier.name}</h2>
        </div>

        <p class="text-xs text-gray-500 mb-2">${supplier.businessType} • ${supplier.location}</p>

        <div class="mb-3">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Materials:</p>
          <div class="flex flex-wrap gap-1">
            ${materials}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div>
            <span class="text-gray-500">Capacity:</span>
            <span class="font-medium">${supplier.capacity}</span>
          </div>
          <div>
            <span class="text-gray-500">Contact:</span>
            <span class="font-medium">${supplier.contactNumber}</span>
          </div>
        </div>

        <div class="mt-auto">
          <button onclick="contactSupplier('${supplier._id}')" 
                  class="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            <i class="fas fa-envelope mr-2"></i>Contact Supplier
          </button>
        </div>
      </div>
    `;
  });
}

// Render requirements (for suppliers)
function renderRequirements(list) {
  productListEl.innerHTML = "";

  if (!list.length) {
    productListEl.innerHTML = `<p class="text-sm text-gray-500">No requirements found.</p>`;
    return;
  }

  list.forEach((req) => {
    productListEl.innerHTML += `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col">
        
        <div class="flex items-start justify-between mb-4">
          <img src="${req.image}" class="rounded-xl h-16 w-16 object-cover">
          ${req.urgent ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg"><i class="fas fa-exclamation-circle mr-1"></i>Urgent</span>' : ''}
        </div>

        <div class="flex justify-between items-start mb-2">
          <h2 class="text-lg font-semibold">${req.material}</h2>
          <span class="text-lg font-bold text-amber-600">${req.budget}</span>
        </div>

        <p class="text-xs text-gray-500 mb-2">Posted by ${req.vendorName} • ${req.vendorLocation}</p>

        <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">${req.description}</p>

        <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div>
            <span class="text-gray-500">Quantity:</span>
            <span class="font-medium">${req.quantity}</span>
          </div>
          <div>
            <span class="text-gray-500">Required by:</span>
            <span class="font-medium">${req.requiredBy}</span>
          </div>
        </div>

        <div class="mt-auto">
          <button onclick="sendProposal('${req._id}')" 
                  class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            <i class="fas fa-paper-plane mr-2"></i>Send Proposal
          </button>
        </div>
      </div>
    `;
  });
}

// Contact supplier (for vendors)
function contactSupplier(supplierId) {
  const supplier = allProducts.find(s => s._id === supplierId);
  if (supplier) {
    alert(`Contact ${supplier.name}\n\nPhone: ${supplier.contactNumber}\nEmail: ${supplier.email}\n\nYou can send them your requirements directly!`);
  }
}

// Send proposal (for suppliers)
function sendProposal(requirementId) {
  const requirement = allProducts.find(r => r._id === requirementId);
  if (requirement) {
    const proposal = prompt(`Send proposal for ${requirement.material}\n\nRequired: ${requirement.quantity}\nBudget: ${requirement.budget}\n\nEnter your proposal details (price per unit, delivery time, etc.):`);

    if (proposal) {
      // Store proposal in localStorage
      const proposals = JSON.parse(localStorage.getItem('proposals') || '[]');
      proposals.push({
        _id: 'proposal_' + Date.now(),
        requirementId: requirementId,
        supplierId: currentUser._id,
        supplierName: currentUser.companyName,
        proposal: proposal,
        status: 'sent',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('proposals', JSON.stringify(proposals));

      alert('Proposal sent successfully! The vendor will contact you if interested.');
    }
  }
}

// Load products (vendors view)
async function loadProducts() {
  console.log("📦 Loading products from backend...");
  try {
    const res = await fetch("/api/products");
    const data = await res.json();

    // Support both API styles: { success, products } or array directly
    const products = Array.isArray(data) ? data : data.products || [];

    // Transform to UI-friendly format
    allProducts = products.map((p) => {
      const supplier = p.supplier || {};
      return {
        _id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        image: p.image || "https://cdn-icons-png.flaticon.com/512/3081/3081559.png",
        inStock: p.inStock !== false,
        tags: p.tags || [],
        rating: p.rating || (supplier.rating || 0),
        supplierId: supplier._id || "",
        supplierName: supplier.shopName || supplier.name || supplier.email || "Unknown Supplier",
        supplierLocation: supplier.location || "",
        supplierPhone: supplier.phone || "",
      };
    });

    filteredProducts = [...allProducts];
    renderProducts(filteredProducts);
    populateSupplierDropdown();
  } catch (error) {
    console.error("Failed to load products:", error);
    if (productListEl) {
      productListEl.innerHTML = `<p class="text-red-500">Failed to load products.</p>`;
    }
  }
}

// Test function to manually render products
window.testRenderProducts = function () {
  console.log("🧪 Testing manual product render...");
  if (!productListEl) {
    console.error("❌ productListEl not available for testing!");
    return;
  }

  productListEl.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col">
      <h3 class="text-lg font-semibold">Test Product</h3>
      <p class="text-gray-600">This is a test product to verify rendering works</p>
      <p class="text-xl font-bold text-amber-600">₹100/kg</p>
    </div>
  `;
  console.log("✅ Test product rendered successfully!");
};

// Populate supplier dropdown
function populateSupplierDropdown() {
  if (!supplierSelectEl) {
    console.error("❌ supplierSelectEl not found in populateSupplierDropdown!");
    return;
  }

  const suppliers = [...new Set(allProducts.map(p => p.supplierName))];
  supplierSelectEl.innerHTML = '<option value="">All suppliers</option>';
  suppliers.forEach(supplier => {
    supplierSelectEl.innerHTML += `<option value="${supplier}">${supplier}</option>`;
  });
}

// Render products
function renderProducts(list) {
  console.log("🎨 Rendering products:", list.length, "items");

  if (!productListEl) {
    console.error("❌ productListEl not found in renderProducts!");
    return;
  }

  productListEl.innerHTML = "";

  if (!list.length) {
    productListEl.innerHTML = `<p class="text-sm text-gray-500">No products found.</p>`;
    return;
  }

  list.forEach((p) => {
    const tags = (p.tags || [])
      .map((t) => `<span class="tag-pill">${t}</span>`)
      .join("");

    productListEl.innerHTML += `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all duration-300 p-4 flex flex-col group">
        
        <!-- Product Image with Quick View -->
        <div class="relative mb-4 cursor-pointer" onclick="quickViewProduct('${p.name}')">
          <img src="${p.image}" class="rounded-xl h-40 w-full object-cover">
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-300 flex items-center justify-center">
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div class="bg-white text-gray-800 px-3 py-1 rounded-lg text-sm font-medium">
                <i class="fas fa-eye mr-1"></i>Quick View
              </div>
            </div>
          </div>
        </div>

        <!-- Product Info -->
        <div class="flex justify-between items-start mb-2">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">${p.name}</h2>
          <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg">
            ★ ${p.rating}
          </span>
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">${p.category}</p>

        <p class="text-xl font-bold text-amber-600 mb-2">₹${p.price}/kg</p>

        <!-- Supplier Info -->
        <div class="mb-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Supplier: 
            <button class="underline text-blue-600 hover:text-blue-700 font-medium"
                    onclick="event.stopPropagation(); viewSupplier('${p.supplierId}')">
              ${p.supplierName}
            </button>
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            <i class="fas fa-map-marker-alt mr-1"></i>${p.supplierLocation}
          </p>
        </div>

        <!-- Stock Status -->
        <span class="badge-stock ${p.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"} mb-2">
          ${p.inStock ? "✓ In Stock" : "✗ Out of Stock"}
        </span>

        <!-- Tags -->
        <div class="mb-3">${tags}</div>

        <!-- Action Buttons -->
        <div class="mt-auto space-y-2">
          <button
            onclick="event.stopPropagation(); addToCart('${p.name}', ${p.price}, '${p.supplierId}')"
            class="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
            <i class="fas fa-cart-plus mr-2"></i>Add to Cart
          </button>
          
          <button
            onclick="event.stopPropagation(); quickViewProduct('${p.name}')"
            class="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
            <i class="fas fa-eye mr-2"></i>Quick View
          </button>
        </div>

      </div>
    `;
  });
}

// View supplier profile
window.viewSupplier = (supplierId) => {
  showSupplierModal(supplierId);
};

// Show supplier modal
function showSupplierModal(supplierId) {
  const supplier = allProducts.find(p => p.supplierId === supplierId);
  if (!supplier) {
    showNotification("Supplier not found", "error");
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-xl font-bold">${supplier.supplierName}</h2>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <div class="space-y-3">
        <div class="flex items-center space-x-3">
          <i class="fas fa-map-marker-alt text-amber-600"></i>
          <span>${supplier.supplierLocation}</span>
        </div>
        <div class="flex items-center space-x-3">
          <i class="fas fa-phone text-amber-600"></i>
          <span>${supplier.supplierPhone}</span>
        </div>
        <div class="flex items-center space-x-3">
          <i class="fas fa-star text-amber-600"></i>
          <span>${supplier.rating} / 5.0</span>
        </div>
      </div>
      
      <div class="mt-6 space-y-3">
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg transition-colors">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Quick view product
window.quickViewProduct = (productName) => {
  const product = allProducts.find(p => p.name === productName);
  if (!product) return;

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-xl font-bold">${product.name}</h2>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <img src="${product.image}" class="w-full h-48 object-cover rounded-lg mb-4">
      
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-2xl font-bold text-amber-600">₹${product.price}/kg</span>
          <span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg">
            ★ ${product.rating}
          </span>
        </div>
        
        <div>
          <span class="text-sm text-gray-500">Category:</span>
          <span class="ml-2 text-sm font-medium">${product.category}</span>
        </div>
        
        <div>
          <span class="text-sm text-gray-500">Supplier:</span>
          <span class="ml-2 text-sm font-medium">${product.supplierName}</span>
        </div>
        
        <div>
          <span class="text-sm text-gray-500">Availability:</span>
          <span class="ml-2 ${product.inStock ? 'text-green-600' : 'text-red-600'}">
            ${product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
        
        <div class="flex flex-wrap gap-1">
          ${(product.tags || []).map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
        </div>
      </div>
      
      <div class="mt-6 space-y-3">
        <button onclick="addToCart('${product.name}', ${product.price}, '${product.supplierId}'); this.closest('.fixed').remove();" 
                class="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg transition-colors">
          <i class="fas fa-cart-plus mr-2"></i>Add to Cart
        </button>
        <button onclick="viewSupplier('${product.supplierId}'); this.closest('.fixed').remove();" 
                class="w-full border border-amber-600 text-amber-600 hover:bg-amber-50 py-2 rounded-lg transition-colors">
          <i class="fas fa-store mr-2"></i>View Supplier
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

// Add to cart
window.addToCart = (name, price, supplierId) => {
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

// (Cart functions like showCartSummary, updateCartCount, removeFromCart have been moved to navbar.js)



// Show notification
function showNotification(message, type = 'info') {
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
    notification.remove();
  }, 3000);
}

// Apply filters
function applyFilters() {
  let list = [...allProducts];

  const q = searchBarEl?.value.toLowerCase() || "";
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));

  const activeChip = categoryChipsEl?.querySelector(".filter-chip.active");
  const selectedCategory = activeChip?.dataset.category || "all";
  if (selectedCategory !== "all") {
    list = list.filter((p) => p.category === selectedCategory);
  }

  const min = Number(priceMinEl?.value || 0);
  const max = Number(priceMaxEl?.value || 0);
  if (min) list = list.filter((p) => p.price >= min);
  if (max) list = list.filter((p) => p.price <= max);

  const supplier = supplierSelectEl?.value || "";
  if (supplier) list = list.filter((p) => p.supplierName === supplier);

  const minRating = Number(ratingSelectEl?.value || 0);
  if (minRating) list = list.filter((p) => p.rating >= minRating);

  if (inStockOnlyEl?.checked) {
    list = list.filter((p) => p.inStock === true);
  }

  const selectedTags = [...tagFilterInputs]
    .filter((i) => i.checked)
    .map((i) => i.value);
  if (selectedTags.length) {
    list = list.filter((p) =>
      selectedTags.every((t) => p.tags.includes(t))
    );
  }

  const sortVal = sortSelectEl?.value || "";
  if (sortVal === "low") list.sort((a, b) => a.price - b.price);
  else if (sortVal === "high") list.sort((a, b) => b.price - a.price);

  filteredProducts = list;
  renderProducts(filteredProducts);
}

// Event Listeners
if (searchBarEl) searchBarEl.addEventListener("input", applyFilters);
if (priceMinEl) priceMinEl.addEventListener("input", applyFilters);
if (priceMaxEl) priceMaxEl.addEventListener("input", applyFilters);
if (supplierSelectEl) supplierSelectEl.addEventListener("change", applyFilters);
if (ratingSelectEl) ratingSelectEl.addEventListener("change", applyFilters);
if (inStockOnlyEl) inStockOnlyEl.addEventListener("change", applyFilters);
if (sortSelectEl) sortSelectEl.addEventListener("change", applyFilters);

if (categoryChipsEl) {
  categoryChipsEl.addEventListener("click", (e) => {
    if (!e.target.classList.contains("filter-chip")) return;

    categoryChipsEl.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
    e.target.classList.add("active");

    applyFilters();
  });
}

tagFilterInputs.forEach((i) => i.addEventListener("change", applyFilters));

if (clearFiltersEl) {
  clearFiltersEl.addEventListener("click", () => {
    if (searchBarEl) searchBarEl.value = "";
    if (priceMinEl) priceMinEl.value = "";
    if (priceMaxEl) priceMaxEl.value = "";
    if (supplierSelectEl) supplierSelectEl.value = "";
    if (ratingSelectEl) ratingSelectEl.value = "";
    if (sortSelectEl) sortSelectEl.value = "";
    if (inStockOnlyEl) inStockOnlyEl.checked = false;

    tagFilterInputs.forEach((i) => (i.checked = false));

    if (categoryChipsEl) {
      categoryChipsEl.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      const allChip = categoryChipsEl.querySelector("[data-category='all']");
      if (allChip) allChip.classList.add("active");
    }

    applyFilters();
  });
}

// INITIAL LOAD
async function init() {
  console.log("🚀 Marketplace.js initialized");

  // Initialize DOM elements first
  initializeDOMElements();

  // Check if essential elements exist
  if (!productListEl) {
    console.error("❌ Product list element not found!");
    return;
  }

  // Update cart count on page load
  updateCartCount();

  // Use role-based content loading
  checkUserRoleAndLoadContent();
}

// Initialize page on DOM load
document.addEventListener("DOMContentLoaded", () => {
  console.log("📱 DOM loaded, initializing marketplace");
  init();
});

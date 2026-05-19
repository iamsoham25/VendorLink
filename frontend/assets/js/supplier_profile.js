import { api } from "./api.js";

const urlParams = new URLSearchParams(window.location.search);
const supplierId = urlParams.get("id");

const supplierCard = document.getElementById("supplierCard");
const supplierName = document.getElementById("supplierName");
const supplierEmail = document.getElementById("supplierEmail");
const supplierLocation = document.getElementById("supplierLocation");
const supplierDescription = document.getElementById("supplierDescription");
const supplierRating = document.getElementById("supplierRating");
const supplierImage = document.getElementById("supplierImage");
const contactBtn = document.getElementById("contactBtn");
const productList = document.getElementById("productList");

// Modal
const modal = document.getElementById("contactModal");
const modalName = document.getElementById("modalName");
const modalPhone = document.getElementById("modalPhone");

window.closeModal = () => {
  modal.classList.add("hidden");
};

async function loadSupplierProfile(supplier) {
  supplierCard.classList.remove("hidden");
  productList.innerHTML = "";

  const sup = supplier;
  supplierName.textContent = sup.name || sup.shopName || "Unknown Supplier";
  supplierEmail.textContent = "✉ " + (sup.email || "Not provided");
  supplierLocation.textContent = "📍 " + (sup.location || sup.address || "Location not available");
  supplierContact.textContent = "📞 " + (sup.contactNumber || sup.phone || sup.email || "Contact not provided");
  supplierRole.textContent = "🧩 Role: " + (sup.role || "supplier");
  supplierShop.textContent = "🏬 Shop Name: " + (sup.shopName || sup.businessName || "N/A");

  const createdAt = sup.createdAt ? new Date(sup.createdAt).toLocaleString() : "N/A";
  const updatedAt = sup.updatedAt ? new Date(sup.updatedAt).toLocaleString() : "N/A";
  document.getElementById("supplierCreated").textContent = "📅 Joined: " + createdAt;
  document.getElementById("supplierUpdated").textContent = "🛠 Updated: " + updatedAt;

  supplierDescription.textContent = sup.description || "Reliable raw materials supplier on VendorLink.";
  const reviewCount = sup.reviewCount || 0;
  supplierRating.textContent = `★ ${sup.rating || "4.5"} (${reviewCount} reviews)`;

  if (sup.image) supplierImage.src = sup.image;
  else if (sup.photo) supplierImage.src = sup.photo;

  const loadingMsg = document.getElementById("loadingMsg");
  if (loadingMsg) loadingMsg.classList.add("hidden");

  if (contactBtn) {
    contactBtn.onclick = () => {
      modal.classList.remove("hidden");
      modalName.textContent = sup.name || sup.shopName || "Supplier";
      modalPhone.textContent = "📞 " + (sup.contactNumber || sup.phone || "Not provided");
    };
  }
}

async function loadSupplier() {
  try {
    const data = await api(`/suppliers/${supplierId}`, "GET");
    const { supplier, products = [], reviews = [] } = data;

    if (supplier) {
      supplier.rating = supplier.rating || (reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : 4.5);
      supplier.reviewCount = supplier.reviewCount || reviews.length;
    }

    await loadSupplierProfile(supplier);

    if (products && products.length > 0) {
      products.forEach((p) => {
        productList.innerHTML += `
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <img src="${p.image || 'https://via.placeholder.com/300'}" class="h-40 w-full object-cover rounded-lg" />
            <h3 class="mt-3 text-lg font-semibold">${p.name || 'Unnamed Product'}</h3>
            <p class="text-sm text-gray-500">${p.category || 'Product'}</p>
            <p class="mt-1 text-amber-600 font-bold">₹${p.price || 'N/A'}</p>
            <button onclick="window.location.href='marketplace.html'" class="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg">View Products</button>
          </div>
        `;
      });
    } else {
      productList.innerHTML = '<p class="text-sm text-gray-500">No products posted by this supplier yet.</p>';
    }
  } catch (err) {
    console.error(err);

    try {
      // Fallback: this id might be a product id, so load product and then supplier.
      const product = await api(`/products/${supplierId}`, "GET");
      if (product && product.supplier) {
        await loadSupplierProfile(product.supplier);

        // Also load all products by supplier if available
        const supplierData = await api(`/suppliers/${product.supplier._id || product.supplier.id}`, "GET");
        const fallbackProducts = supplierData.products || [];
        if (fallbackProducts.length > 0) {
          productList.innerHTML = "";
          fallbackProducts.forEach((p) => {
            productList.innerHTML += `
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <img src="${p.image || 'https://via.placeholder.com/300'}" class="h-40 w-full object-cover rounded-lg" />
                <h3 class="mt-3 text-lg font-semibold">${p.name || 'Unnamed Product'}</h3>
                <p class="text-sm text-gray-500">${p.category || 'Product'}</p>
                <p class="mt-1 text-amber-600 font-bold">₹${p.price || 'N/A'}</p>
              </div>
            `;
          });
        }
        return;
      }
    } catch (fallbackErr) {
      console.warn('Fallback product lookup failed:', fallbackErr);
    }

    // final fallback: search all suppliers list
    try {
      const allSuppliers = await api("/suppliers", "GET");
      const found = allSuppliers.find(s => s._id === supplierId || s.id === supplierId);
      if (found) {
        await loadSupplierProfile(found);
        productList.innerHTML = '<p class="text-sm text-gray-500">No products metadata available for this supplier yet.</p>';
        return;
      }
    } catch (listErr) {
      console.warn('Fallback supplier list lookup failed:', listErr);
    }

    document.getElementById("loadingMsg").textContent = "Supplier not found in database.";
    alert("Supplier not found. Please check the supplier link or try another supplier.");
  }
}


window.addToCart = (name, price, supplierId) => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ name, price, qty: 1, supplierId });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart!");
};

loadSupplier();

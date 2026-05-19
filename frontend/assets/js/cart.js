import { api } from "./api.js";

let cart = JSON.parse(localStorage.getItem("cart") || "[]");
const cartContainer = document.getElementById("cartContainer");
const cartTotalEl = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateTotal() {
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.qty;
  });

  cartTotalEl.textContent = total;
}

function increaseQty(index) {
  cart[index].qty += 1;
  saveCart();
  renderCart();
}

function decreaseQty(index) {
  if (cart[index].qty > 1) {
    cart[index].qty -= 1;
  } else {
    cart.splice(index, 1);
  }
  saveCart();
  renderCart();
}

function deleteItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function renderCart() {
  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <p class="text-gray-500 text-lg">Your cart is empty.</p>
    `;
    updateTotal();
    return;
  }

  cart.forEach((item, index) => {
    cartContainer.innerHTML += `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">

        <img src="${item.image || 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png'}" 
             class="h-20 w-20 object-cover rounded-lg">

        <div class="flex-1">
          <h3 class="font-semibold text-lg">${item.name}</h3>
          <p class="text-sm text-gray-500">₹${item.price}/kg</p>

          <div class="flex items-center gap-3 mt-2">
            <button onclick="decreaseQty(${index})"
              class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg">-</button>

            <span class="font-semibold">${item.qty}</span>

            <button onclick="increaseQty(${index})"
              class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg">+</button>
          </div>
        </div>

        <button onclick="deleteItem(${index})"
                class="text-red-500 hover:text-red-700 font-semibold">
          Remove
        </button>

      </div>
    `;
  });

  updateTotal();
}

// Expose functions
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.deleteItem = deleteItem;

renderCart();

// Checkout (Proceed to Checkout)
checkoutBtn.addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  // Redirect directly to payment page
  window.location.href = "payment.html";
});

// assets/js/product.js
import { api } from "./api.js";
import { getUser } from "./utils.js";

const user = getUser();
if (!user) {
  window.location.href = "login.html";
}

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function loadProduct() {
  try {
    const p = await api(`/products/${id}`);

    document.getElementById("p-image").src = p.image || "https://via.placeholder.com/600x400";
    document.getElementById("p-name").textContent = p.name;
    document.getElementById("p-category").textContent = p.category || "";
    document.getElementById("p-price").textContent = "₹" + p.price;

    const btn = document.getElementById("orderBtn");
    btn.onclick = () => orderProduct(p._id);
  } catch (err) {
    alert(err.message);
  }
}

async function orderProduct(productId) {
  const qty = Number(prompt("Enter quantity:", "1") || "1");
  if (!qty || qty <= 0) return;

  try {
    await api("/orders", "POST", { productId, quantity: qty }, true);
    alert("Order placed successfully!");
  } catch (err) {
    alert(err.message);
  }
}

loadProduct();

// assets/js/profile.js
import { api } from "./api.js";

const editBtn = document.getElementById("editBtn");
const editPhotoBtn = document.getElementById("editPhotoBtn");
const profileModal = document.getElementById("editProfileModal");
const closeEditBtn = document.getElementById("closeEditProfileBtn");
const cancelEditBtn = document.getElementById("cancelEditProfileBtn");
const profileForm = document.getElementById("profileForm");
const profileImageInput = document.getElementById("profileImageInput");
const profileImagePreview = document.getElementById("profileImagePreview");
const profilePreviewInitial = document.getElementById("profilePreviewInitial");
const profileError = document.getElementById("profileFormError");
const profileSuccess = document.getElementById("profileFormSuccess");

let currentUser = null;
let selectedImageData = null;

function showModal() {
  profileError.classList.add("hidden");
  profileSuccess.classList.add("hidden");
  profileModal.classList.remove("hidden");
}

function closeModal() {
  profileModal.classList.add("hidden");
  selectedImageData = null;
  profileImageInput.value = "";
}

function setAvatar(user) {
  const avatarImage = document.getElementById("avatarImage");
  const avatarInitial = document.getElementById("avatarInitial");

  if (user.image) {
    avatarImage.src = user.image;
    avatarImage.classList.remove("hidden");
    avatarInitial.classList.add("hidden");
  } else {
    avatarImage.classList.add("hidden");
    avatarInitial.classList.remove("hidden");
    avatarInitial.textContent = (user.name || "User").charAt(0).toUpperCase();
  }
}

function renderProfile(user) {
  currentUser = user;
  document.getElementById("prof-name").textContent = user.name || "—";
  document.getElementById("prof-email").innerHTML = `<i class="fas fa-envelope text-gray-400"></i> ${user.email || "—"}`;
  document.getElementById("prof-role-badge").textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—";

  const roleBadge = document.getElementById("prof-role-badge");
  const roleColors = {
    vendor: "bg-blue-100 text-blue-700",
    supplier: "bg-green-100 text-green-700",
    customer: "bg-purple-100 text-purple-700",
  };
  roleBadge.className = `text-xs font-bold px-3 py-1 rounded-full ${roleColors[user.role] || roleColors.vendor}`;

  document.getElementById("detail-name").textContent = user.name || "—";
  document.getElementById("detail-email").textContent = user.email || "—";
  document.getElementById("detail-role").textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—";
  document.getElementById("detail-location").textContent = user.location || "—";
  document.getElementById("detail-contact").textContent = user.contactNumber || "—";
  document.getElementById("detail-shop").textContent = user.shopName || "—";

  const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
  document.getElementById("detail-joined").textContent = createdAt.toLocaleDateString("en-IN", { year: "numeric", month: "long" });
  setAvatar(user);

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const spent = cart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);

  document.getElementById("stat-orders").textContent = orders.length || "0";
  document.getElementById("stat-spent").textContent = spent > 0 ? `₹${spent}` : "₹0";
  document.getElementById("stat-saved").textContent = cart.length || "0";
}

function fillEditForm(user) {
  document.getElementById("profileName").value = user.name || "";
  document.getElementById("profileEmail").value = user.email || "";
  document.getElementById("profileShop").value = user.shopName || "";
  document.getElementById("profileContact").value = user.contactNumber || "";
  document.getElementById("profileLocation").value = user.location || "";
  if (user.image) {
    profileImagePreview.src = user.image;
    profileImagePreview.classList.remove("hidden");
    profilePreviewInitial.classList.add("hidden");
    selectedImageData = user.image;
  } else {
    profileImagePreview.classList.add("hidden");
    profilePreviewInitial.classList.remove("hidden");
    profilePreviewInitial.textContent = (user.name || "User").charAt(0).toUpperCase();
    selectedImageData = null;
  }
}

async function refreshCurrentUser() {
  try {
    const res = await api("/auth/me", "GET", null, true);
    localStorage.setItem("user", JSON.stringify(res));
    renderProfile(res);
  } catch (err) {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) {
      window.location.href = "login.html";
      return;
    }
    renderProfile(stored);
  }
}

function handleError(message) {
  profileError.textContent = message;
  profileError.classList.remove("hidden");
  profileSuccess.classList.add("hidden");
}

function handleSuccess(message) {
  profileSuccess.textContent = message;
  profileSuccess.classList.remove("hidden");
  profileError.classList.add("hidden");
}

async function handleSave(event) {
  event.preventDefault();
  if (!currentUser) return;

  const updates = {
    name: document.getElementById("profileName").value.trim(),
    email: document.getElementById("profileEmail").value.trim(),
    shopName: document.getElementById("profileShop").value.trim(),
    contactNumber: document.getElementById("profileContact").value.trim(),
    location: document.getElementById("profileLocation").value.trim(),
  };

  if (selectedImageData) {
    updates.image = selectedImageData;
  }

  try {
    const res = await api("/auth/me", "PUT", updates, true);
    localStorage.setItem("user", JSON.stringify(res.user));
    renderProfile(res.user);
    handleSuccess("Profile saved successfully.");
    setTimeout(() => {
      closeModal();
    }, 900);
  } catch (err) {
    handleError(err.message || "Unable to save profile.");
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

profileImageInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    handleError("Please upload a valid image file.");
    return;
  }

  try {
    selectedImageData = await readFileAsDataURL(file);
    profileImagePreview.src = selectedImageData;
    profileImagePreview.classList.remove("hidden");
    profilePreviewInitial.classList.add("hidden");
  } catch (err) {
    handleError("Could not load selected image.");
  }
});

editBtn.addEventListener("click", () => {
  if (!currentUser) return;
  fillEditForm(currentUser);
  showModal();
});

editPhotoBtn.addEventListener("click", () => {
  profileImageInput.click();
});

closeEditBtn.addEventListener("click", closeModal);
cancelEditBtn.addEventListener("click", closeModal);
profileForm.addEventListener("submit", handleSave);

window.handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("cart");
  window.location.href = "index.html";
};

window.addEventListener("DOMContentLoaded", refreshCurrentUser);

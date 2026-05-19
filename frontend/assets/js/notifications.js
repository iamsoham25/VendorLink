/**
 * Frontend Notification Handling
 * File: frontend/assets/js/notifications.js
 * 
 * Add this file to handle real-time notifications on the client side
 * Include it in all HTML files that need to display notifications
 */

// ============================================================================
// SOCKET.IO CLIENT CONNECTION
// ============================================================================

let socket = null;
let currentUserId = null;

/**
 * Initialize Socket.IO connection when page loads
 * Call this function on page load or in main.js
 */
function initializeNotifications() {
  // Connect to Socket.IO server
  socket = io(window.location.origin, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Get current user ID from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user._id) {
    currentUserId = user._id;

    // Emit join event to register this user
    socket.emit("join", { userId: currentUserId });
    console.log("Connected to notifications for user:", currentUserId);
  }

  // Connection events
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });

  // Register all notification listeners
  setupNotificationListeners();
}

// ============================================================================
// NOTIFICATION EVENT LISTENERS
// ============================================================================

function setupNotificationListeners() {
  // NEW VENDOR ADDED
  socket.on("new_vendor_added", (data) => {
    console.log("New vendor added:", data);
    showNotification(
      "success",
      `New vendor: ${data.vendorName}`,
      `Check out ${data.vendorName} in ${data.category}`
    );

    // Update UI - add vendor to list if visible
    if (typeof updateVendorList === "function") {
      updateVendorList();
    }
  });

  // ORDER STATUS UPDATED
  socket.on("order_status_updated", (data) => {
    console.log("Order status updated:", data);

    let iconClass = "fa-package";
    if (data.status === "delivered") iconClass = "fa-check-circle";
    if (data.status === "cancelled") iconClass = "fa-times-circle";

    showNotification(
      "info",
      `Order ${data.orderId.substring(0, 8)}... Updated`,
      `Status: ${data.status}`
    );

    // Update order list if visible
    if (typeof updateOrdersList === "function") {
      updateOrdersList();
    }
  });

  // PRICE DROP ALERT
  socket.on("price_drop_alert", (data) => {
    console.log("Price drop alert:", data);
    showNotification(
      "success",
      `Price Drop: ${data.productName}`,
      `Now ₹${data.newPrice} (was ₹${data.oldPrice}) - Save ${data.discountPercentage}%!`,
      "price_drop"
    );

    // Optional: Add to a special price alerts section
    if (typeof addPriceDropAlert === "function") {
      addPriceDropAlert(data);
    }
  });

  // HIGH DEMAND ALERT
  socket.on("high_demand_alert", (data) => {
    console.log("High demand alert:", data);
    showNotification(
      "warning",
      `Limited Stock: ${data.productName}`,
      `Only ${data.stockLevel} items left - ${data.demandCount} buyers interested!`,
      "high_demand"
    );
  });

  // GENERIC NOTIFICATION (fallback)
  socket.on("notification", (data) => {
    console.log("Generic notification:", data);
    showNotification(data.type || "info", data.title, data.message);
  });
}

// ============================================================================
// NOTIFICATION UI DISPLAY FUNCTIONS
// ============================================================================

/**
 * Show a toast notification
 * @param {string} type - 'success', 'error', 'info', 'warning'
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} category - Optional category for special handling
 */
function showNotification(type, title, message, category = null) {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.id = `notif-${Date.now()}`;

  // Icon mapping
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-times-circle",
    info: "fas fa-info-circle",
    warning: "fas fa-exclamation-circle",
  };

  notification.innerHTML = `
    <div class="notification-content">
      <i class="${icons[type] || icons.info}"></i>
      <div class="notification-text">
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
      <button class="notification-close" onclick="closeNotification('${notification.id}')">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  // Add to DOM
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  container.appendChild(notification);

  // Add animation class
  setTimeout(() => notification.classList.add("show"), 10);

  // Auto-remove after 5 seconds (or 10 for warnings)
  const timeout = type === "warning" ? 10000 : 5000;
  setTimeout(() => closeNotification(notification.id), timeout);

  // Play sound if available
  playNotificationSound(type);

  // Log to browser console for debugging
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
}

function closeNotification(notificationId) {
  const notification = document.getElementById(notificationId);
  if (notification) {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }
}

/**
 * Play notification sound
 */
function playNotificationSound(type) {
  // You can add sound files to your assets folder
  const sounds = {
    success: "/assets/sounds/success.mp3",
    error: "/assets/sounds/error.mp3",
    info: "/assets/sounds/info.mp3",
    warning: "/assets/sounds/warning.mp3",
  };

  try {
    const audio = new Audio(sounds[type] || sounds.info);
    audio.volume = 0.3; // 30% volume
    audio.play().catch((e) => console.log("Could not play sound:", e));
  } catch (e) {
    // Silently fail if audio not supported
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR SPECIAL NOTIFICATIONS
// ============================================================================

/**
 * Add a price drop to a special alert list (if you have one)
 */
function addPriceDropAlert(data) {
  // This would integrate with your marketplace page
  const alertsContainer = document.getElementById("price-alerts");
  if (!alertsContainer) return;

  const alert = document.createElement("div");
  alert.className = "price-alert";
  alert.innerHTML = `
    <div class="alert-content">
      <h4>${data.productName}</h4>
      <p class="old-price"><strike>₹${data.oldPrice}</strike></p>
      <p class="new-price">₹${data.newPrice}</p>
      <p class="discount">Save ${data.discountPercentage}%</p>
      <button onclick="goToProduct('${data.productId}')">View Product</button>
    </div>
  `;
  alertsContainer.insertBefore(alert, alertsContainer.firstChild);
}

/**
 * Go to a product page
 */
function goToProduct(productId) {
  window.location.href = `/product.html?id=${productId}`;
}

// ============================================================================
// USER STATUS AND BADGE UPDATES
// ============================================================================

/**
 * Update notification badge (dot or count)
 */
function updateNotificationBadge(unreadCount = 1) {
  let badge = document.getElementById("notification-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.id = "notification-badge";
    badge.className = "notification-badge";
    const notificationIcon = document.querySelector(".notification-icon");
    if (notificationIcon) {
      notificationIcon.appendChild(badge);
    }
  }

  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
    badge.style.display = "block";
  } else {
    badge.style.display = "none";
  }
}

/**
 * Mark user as online for others
 */
function setUserOnline() {
  if (socket && currentUserId) {
    socket.emit("user_online", { userId: currentUserId });
  }
}

/**
 * Notify server when user goes offline (before leaving page)
 */
function setUserOffline() {
  if (socket && currentUserId) {
    socket.emit("user_offline", { userId: currentUserId });
  }
}

// ============================================================================
// SETUP ON PAGE LOAD AND UNLOAD
// ============================================================================

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  initializeNotifications();
});

// Clean up when user leaves
window.addEventListener("beforeunload", () => {
  setUserOffline();
  if (socket) {
    socket.disconnect();
  }
});

// ============================================================================
// DEBUGGING AND TESTING
// ============================================================================

/**
 * Test function - simulate receiving a notification
 * Run in console: testNotification('success', 'Test Title', 'Test Message')
 */
function testNotification(type = "info", title = "Test", message = "This is a test") {
  showNotification(type, title, message);
}

/**
 * View all active socket events
 */
function debugSocketEvents() {
  console.log("Current user ID:", currentUserId);
  console.log("Socket ID:", socket?.id);
  console.log("Socket connected:", socket?.connected);
  console.log("Socket events registered:", Object.keys(socket?._events || {}));
}

// Export for use in other files
window.notificationUtils = {
  showNotification,
  closeNotification,
  addPriceDropAlert,
  goToProduct,
  updateNotificationBadge,
  setUserOnline,
  setUserOffline,
  testNotification,
  debugSocketEvents,
};

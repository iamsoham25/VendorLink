// assets/js/navbar.js

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.createElement("div");
  nav.style.cssText = "position: sticky; top: 0; z-index: 50;";

  nav.innerHTML = `
    <nav class="w-full px-8 py-0 flex items-center justify-between"
         style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%); height: 64px;">

      <!-- Logo -->
      <a href="home.html" class="flex items-center gap-2 shrink-0">
        <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
          <i class="fas fa-link text-white text-sm"></i>
        </div>
        <span style="font-size:1.25rem; font-weight:800; background: linear-gradient(135deg,#fb923c,#ea580c); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">VendorLink</span>
      </a>

      <!-- Nav Links -->
      <ul class="flex items-center gap-1 text-sm font-medium">
        <li>
          <a id="homeNavLink" href="home.html"
             class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
            <i class="fas fa-home text-orange-400 text-xs"></i> Home
          </a>
        </li>
        <li id="marketplaceNavLink">
          <a href="marketplace.html"
             class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
            <i class="fas fa-store text-orange-400 text-xs"></i> Marketplace
          </a>
        </li>

        <li id="vendorLinks" style="display:none;">
          <a href="vendor-marketplace.html"
             class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
            <i class="fas fa-handshake text-blue-400 text-xs"></i> Find Suppliers
          </a>
        </li>
        <li id="supplierLinks" style="display:none;">
          <a href="supplier-marketplace.html"
             class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
            <i class="fas fa-clipboard-list text-green-400 text-xs"></i> Requirements
          </a>
        </li>

        <li id="communityHubLink">
          <a href="community.html"
             class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
            <i class="fas fa-users text-purple-400 text-xs"></i> Community
          </a>
        </li>

        <li>
          <a href="ai_predict.html"
             class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
            <i class="fas fa-magic text-pink-400 text-xs"></i> AI Price
          </a>
        </li>

        <li id="cartLink">
          <a href="#" onclick="showCartSummary(); return false;"
             class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
            <i class="fas fa-shopping-cart text-orange-400 text-xs"></i>
            <span>Cart</span>
          </a>
        </li>
      </ul>

      <!-- Right: Bell + Auth -->
      <div class="flex items-center gap-3">

        <!-- Notification Bell -->
        <div id="notificationBellGroup" class="relative" style="display:none;">
          <button id="notificationBell"
                  class="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all">
            <i class="fas fa-bell text-sm"></i>
            <span id="notificationBadge"
                  class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center hidden">0</span>
          </button>

          <!-- Notification Dropdown -->
          <div id="notificationDropdown"
               class="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 hidden z-[100]">
            <div class="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 class="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
              <button onclick="window.clearNotifications()" class="text-xs text-orange-500 hover:underline">Clear All</button>
            </div>
            <div id="notificationList" class="max-h-80 overflow-y-auto p-2 space-y-2">
              <p class="text-center text-gray-400 text-sm py-8 italic">No new notifications</p>
            </div>
          </div>
        </div>

        <div id="authButtons" class="flex items-center gap-3"></div>
      </div>

    </nav>
  `;

  document.body.prepend(nav);

  // Load Socket.IO if not already loaded (for robustness, though we add it in HTML)
  if (typeof io === 'undefined') {
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.onload = () => initializeGlobalSocket();
    document.head.appendChild(script);
  } else {
    initializeGlobalSocket();
  }

  // -------------------------------
  // AUTHENTICATION STATE HANDLING
  // -------------------------------
  const authBox = document.getElementById("authButtons");
  const notificationGroup = document.getElementById("notificationBellGroup");
  let loggedUser = JSON.parse(localStorage.getItem("user"));

  // simple token validation helper (same logic as protect.js)
  function isTokenValid(token) {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  const storedToken = localStorage.getItem("token");
  if (loggedUser && !isTokenValid(storedToken)) {
    // clear stale session
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    loggedUser = null;
  }

  if (!loggedUser) {
    authBox.innerHTML = `
      <a href="login.html"
         class="px-4 py-1.5 text-sm border border-white/20 text-gray-300 rounded-lg hover:bg-white/10 transition-all">
        Login
      </a>
      <a href="role-selection.html"
         class="px-4 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-orange-500/30">
        Sign Up
      </a>
    `;
  } else {
    notificationGroup.style.display = 'block';

    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');

    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
      if (!dropdown.classList.contains('hidden')) window.markAllAsRead();
    });
    document.addEventListener('click', () => dropdown.classList.add('hidden'));
    dropdown.addEventListener('click', (e) => e.stopPropagation());

    const roleColors = {
      vendor:   'bg-blue-500/20 text-blue-300',
      supplier: 'bg-green-500/20 text-green-300',
      customer: 'bg-purple-500/20 text-purple-300',
    };
    const roleColor  = roleColors[loggedUser.role] || roleColors.customer;
    const displayName = loggedUser.name || loggedUser.fullName || loggedUser.username || 'User';
    const initial     = displayName.charAt(0).toUpperCase();
    const avatarHtml  = loggedUser.image
      ? `<img src="${loggedUser.image}" alt="Avatar" class="w-7 h-7 rounded-full object-cover shrink-0" />`
      : `<div class="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-extrabold shrink-0 group-hover:scale-110 transition-transform">${initial}</div>`;

    authBox.innerHTML = `
      <a href="profile.html" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-orange-500/40 transition-all group">
        ${avatarHtml}
        <span class="text-sm text-gray-200 font-medium">${displayName}</span>
        <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${roleColor}">
          ${loggedUser.role ? loggedUser.role.charAt(0).toUpperCase() + loggedUser.role.slice(1) : ''}
        </span>
      </a>
      <button onclick="window.logoutUser()"
              class="w-8 h-8 rounded-xl bg-red-500/20 hover:bg-red-500/40 border border-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all" title="Logout">
        <i class="fas fa-sign-out-alt text-sm"></i>
      </button>
    `;

    // Show role-specific navigation
    if (loggedUser.role === 'vendor' || loggedUser.role === 'customer') {
      document.getElementById('vendorLinks').style.display = 'block';
    } else if (loggedUser.role === 'supplier') {
      document.getElementById('supplierLinks').style.display = 'block';

      // supplier home should go to supplier_home/dashboard rather than buyer homepage
      const homeLink = document.getElementById('homeNavLink');
      if (homeLink) {
        homeLink.setAttribute('href', 'supplier_home.html');
      }

      const marketLink = document.getElementById('marketplaceNavLink');
      if (marketLink) {
        marketLink.innerHTML = `<a href="supplier_dashboard.html" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"><i class="fas fa-chart-bar text-orange-400 text-xs"></i> Supplier Hub</a>`;
      }
      // Hide Cart and Community Hub for suppliers
      const cartLink = document.getElementById('cartLink');
      const communityLink = document.getElementById('communityHubLink');
      if (cartLink) cartLink.style.display = 'none';
      if (communityLink) communityLink.style.display = 'none';
    }
  }

  // Render initial notifications
  window.updateNotificationUI();
});

// GLOBAL WEBSOCKET & NOTIFICATION SYSTEM
let globalSocket;
function initializeGlobalSocket() {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || typeof io === 'undefined') return;

  globalSocket = io({
    auth: {
      token: token,
      userId: user._id || user.id
    }
  });

  globalSocket.on('connect', () => console.log('✔ Global WebSocket connected'));

  globalSocket.on('new_requirement', (data) => {
    addNotification({
      id: Date.now(),
      type: 'requirement',
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      read: false,
      data: data.requirement
    });

    // Broadcast to other components (like marketplace list)
    window.dispatchEvent(new CustomEvent('new-requirement-alert', { detail: data }));
  });

  globalSocket.on('new_order', (data) => {
    addNotification({
      id: Date.now(),
      type: 'order',
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      read: false,
      data: data
    });
  });

  globalSocket.on('order_status_updated', (data) => {
    addNotification({
      id: Date.now(),
      type: 'order_update',
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      read: false,
      data: data
    });
  });

  globalSocket.on('payment_received', (data) => {
    addNotification({
      id: Date.now(),
      type: 'payment',
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      read: false,
      data: data
    });
  });

  globalSocket.on('new_proposal', (data) => {
    addNotification({
      id: Date.now(),
      type: 'requirement',
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      read: false,
      data: data
    });
  });

  globalSocket.on('test_notification', (data) => {
    addNotification({
      id: Date.now(),
      type: data.type || 'info',
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      read: false
    });
  });
}

function addNotification(notif) {
  let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  notifications.unshift(notif);
  // Keep last 20
  if (notifications.length > 20) notifications.pop();
  localStorage.setItem('notifications', JSON.stringify(notifications));

  window.updateNotificationUI();

  // Also show a toast if on-screen
  if (window.showRealTimeNotification) {
    window.showRealTimeNotification(notif.title, notif.message, notif.type, notif.data);
  }
}

window.updateNotificationUI = function () {
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  const listEl = document.getElementById('notificationList');
  const badge = document.getElementById('notificationBadge');
  // Fallback Notification Toast (if page doesn't have one)
  if (!window.showRealTimeNotification) {
    window.showRealTimeNotification = function (title, message, type = 'info') {
      const container = document.getElementById('global-toast-container') || (() => {
        const c = document.createElement('div');
        c.id = 'global-toast-container';
        c.className = 'fixed bottom-6 right-6 z-[100] flex flex-col items-end';
        document.body.appendChild(c);
        return c;
      })();

      const toast = document.createElement('div');
      toast.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 mb-3 transform transition-all duration-500 translate-x-full opacity-0 max-w-sm border-l-4 ' + getBorderColorGlobal(type);

      toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 mr-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center ${getBgColorGlobal(type)}">
            <i class="fas ${getIconGlobal(type)} ${getTextColorGlobal(type)}"></i>
          </div>
        </div>
        <div class="flex-1">
          <h4 class="font-bold text-sm text-gray-900 dark:text-white">${title}</h4>
          <p class="text-xs text-gray-600 dark:text-gray-400">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600 ml-2">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>
    `;

      container.appendChild(toast);
      setTimeout(() => toast.classList.remove('translate-x-full', 'opacity-0'), 100);
      setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
      }, 6000);
    };
  }

  function getBorderColorGlobal(type) {
    switch (type) {
      case 'requirement': return 'border-blue-500';
      case 'order': return 'border-orange-500';
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      default: return 'border-amber-500';
    }
  }

  function getBgColorGlobal(type) {
    switch (type) {
      case 'requirement': return 'bg-blue-100';
      case 'order': return 'bg-orange-100';
      case 'success': return 'bg-green-100';
      case 'error': return 'bg-red-100';
      default: return 'bg-amber-100';
    }
  }

  function getTextColorGlobal(type) {
    switch (type) {
      case 'requirement': return 'text-blue-600';
      case 'order': return 'text-orange-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-amber-600';
    }
  }

  function getIconGlobal(type) {
    switch (type) {
      case 'requirement': return 'fa-briefcase';
      case 'order': return 'fa-box';
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-triangle';
      default: return 'fa-bell';
    }
  }
  if (!listEl) return;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  if (notifications.length === 0) {
    listEl.innerHTML = `<p class="text-center text-gray-400 text-sm py-8 italic">No new notifications</p>`;
    return;
  }

  listEl.innerHTML = notifications.map(n => `
    <div class="p-3 rounded-xl ${n.read ? 'bg-white' : 'bg-amber-50'} border border-gray-100 dark:bg-gray-700 dark:border-gray-600 transition-colors">
      <div class="flex items-start">
        <div class="mr-3 mt-1">
          <i class="fas ${getNotifIcon(n.type)} ${getNotifColor(n.type)} text-sm"></i>
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold text-gray-900 dark:text-gray-100">${n.title}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">${n.message}</p>
          <p class="text-[10px] text-gray-400 mt-1">${formatTime(n.timestamp)}</p>
        </div>
        ${!n.read ? '<div class="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>' : ''}
      </div>
    </div>
  `).join('');
};

window.markAllAsRead = function () {
  let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  notifications = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem('notifications', JSON.stringify(notifications));
  window.updateNotificationUI();
};

window.clearNotifications = function () {
  localStorage.setItem('notifications', '[]');
  window.updateNotificationUI();
};

function getNotifIcon(type) {
  switch (type) {
    case 'requirement': return 'fa-briefcase';
    case 'order': return 'fa-shopping-basket';
    case 'order_update': return 'fa-truck';
    case 'payment': return 'fa-credit-card';
    case 'success': return 'fa-check-circle';
    case 'info': return 'fa-info-circle';
    default: return 'fa-bell';
  }
}

function getNotifColor(type) {
  switch (type) {
    case 'requirement': return 'text-blue-500';
    case 'order': return 'text-orange-500';
    case 'order_update': return 'text-purple-500';
    case 'payment': return 'text-emerald-500';
    case 'success': return 'text-green-500';
    case 'info': return 'text-blue-400';
    default: return 'text-amber-500';
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Logout function — must be on window so onclick can reach it
window.logoutUser = function logoutUser() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('cart');
  window.location.href = 'index.html';
};

// CART FUNCTIONS FOR NAVBAR
window.updateCartCount = function () {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const cartLink = document.getElementById('cartLink');
  if (cartLink) {
    const link = cartLink.querySelector('a');
    if (link) {
      link.innerHTML = `<i class="fas fa-shopping-cart mr-1"></i><span>Cart (${totalItems})</span>`;
    }
  }
};

// Initialize cart count
document.addEventListener("DOMContentLoaded", () => {
  if (window.updateCartCount) {
    setTimeout(window.updateCartCount, 100);
  }
});

window.showCartSummary = function () {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  if (cart.length === 0) {
    alert("Your cart is empty!");
    if (window.location.pathname.endsWith('cart.html')) {
      window.location.href = 'marketplace.html';
    }
    return;
  }

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Your Cart (${totalItems} items)</h2>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <div class="space-y-3 mb-4">
        ${cart.map((item, index) => `
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex-1">
              <h4 class="font-medium">${item.name}</h4>
              <p class="text-sm text-gray-500">₹${item.price}/kg × ${item.qty}</p>
            </div>
            <div class="flex items-center space-x-2">
              <span class="font-bold">₹${item.price * item.qty}</span>
              <button onclick="window.removeFromCartNavbar(${index}); this.closest('.fixed').remove(); window.showCartSummary();" class="text-red-500 hover:text-red-700">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="border-t pt-4">
        <div class="flex justify-between items-center mb-4">
          <span class="text-lg font-bold">Total: ₹${totalPrice}</span>
        </div>
        
        <div class="space-y-2">
          <button onclick="window.location.href='cart.html'" 
                  class="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg transition-colors">
            <i class="fas fa-shopping-cart mr-2"></i>View Full Cart
          </button>
          <button onclick="this.closest('.fixed').remove()" 
                  class="w-full border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 rounded-lg transition-colors">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

window.removeFromCartNavbar = function (index) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  window.updateCartCount();
  // If we are on the cart page, also trigger renderCart to update the main page layout
  if (window.renderCart) {
    window.renderCart();
  }
};

// LOAD FOOTER ON EVERY PAGE
function updateFooterForRole() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user || user.role !== 'supplier') return;

  const footerLinkHome = document.getElementById('footerLinkHome');
  const footerLinkSecondary = document.getElementById('footerLinkSecondary');
  const footerLinkTertiary = document.getElementById('footerLinkTertiary');
  const footerLinkQuaternaryItem = document.getElementById('footerLinkQuaternaryItem');

  if (footerLinkHome) {
    footerLinkHome.href = 'supplier_home.html';
    footerLinkHome.textContent = 'Home';
  }
  if (footerLinkSecondary) {
    footerLinkSecondary.href = 'supplier_dashboard.html';
    footerLinkSecondary.textContent = 'Supplier Hub';
  }
  if (footerLinkTertiary) {
    footerLinkTertiary.href = 'supplier-marketplace.html';
    footerLinkTertiary.textContent = 'Requirements';
  }
  if (footerLinkQuaternaryItem) {
    footerLinkQuaternaryItem.style.display = 'none';
  }
}

fetch("components/footer.html")
  .then(res => res.text())
  .then(html => {
    document.body.insertAdjacentHTML("beforeend", html);
    updateFooterForRole();
  });


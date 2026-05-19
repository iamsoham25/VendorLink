// js/index.js
async function loadProducts() {
  try {
    const list = document.getElementById('productList');
    if (!list) return; // productList doesn't exist on this page, skip
    
    // use relative API path so it works when served from the same origin
    const res = await fetch('/api/products');
    const products = await res.json();
    list.innerHTML = '';
    products.forEach(p => {
      const el = document.createElement('div');
      el.className = 'product-card';
      el.innerHTML = `
        <h3>${p.title}</h3>
        <p>${p.description || ''}</p>
        <p>Price: ₹${p.price}</p>
      `;
      list.appendChild(el);
    });
  } catch (err) {
    console.error('Error loading products', err);
  }
}

document.addEventListener('DOMContentLoaded', loadProducts);

// --- Development: Socket.IO client debug helper and simple toast UI ---
(function initSocketDebug() {
  // Store socket globally to prevent garbage collection
  window.notificationSocket = null;
  
  // Create a simple toast container if not present
  let container = document.getElementById('debugNotifications');
  if (!container) {
    container = document.createElement('div');
    container.id = 'debugNotifications';
    container.style.position = 'fixed';
    container.style.right = '16px';
    container.style.top = '16px';
    container.style.zIndex = 9999;
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    document.body.appendChild(container);
  }

  function showToast(title, message, timeout = 6000) {
    const toast = document.createElement('div');
    toast.style.background = 'rgba(0,0,0,0.8)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 14px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
    toast.style.maxWidth = '320px';
    toast.style.display = 'flex';
    toast.style.justifyContent = 'space-between';
    toast.style.alignItems = 'flex-start';
    toast.style.gap = '10px';
    
    // Content wrapper
    const content = document.createElement('div');
    content.innerHTML = `<strong style="display:block;margin-bottom:4px">${title}</strong><div style="font-size:0.9em">${message}</div>`;
    content.style.flex = '1';
    
    // Close button (X symbol)
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#fff';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '0';
    closeBtn.style.width = '20px';
    closeBtn.style.height = '20px';
    closeBtn.style.display = 'flex';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.flexShrink = '0';
    closeBtn.style.transition = 'color 200ms ease';
    
    // Hover effect on close button
    closeBtn.onmouseover = () => { closeBtn.style.color = '#ccc'; };
    closeBtn.onmouseout = () => { closeBtn.style.color = '#fff'; };
    
    // Click to close
    closeBtn.onclick = () => {
      toast.style.transition = 'opacity 300ms ease, transform 300ms ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-6px)';
      setTimeout(() => toast.remove(), 350);
    };
    
    toast.appendChild(content);
    toast.appendChild(closeBtn);
    container.appendChild(toast);
    
    console.log(`📬 Toast displayed: "${title}"`);
  }

  // Try to connect when page loads
  function connectSocket() {
    try {
      if (typeof io === 'undefined') {
        console.warn('Socket.IO client not found (window.io). Retrying...');
        setTimeout(connectSocket, 500);
        return;
      }

      console.log('Socket debug: creating connection...');
      
      // Create socket with reconnection options
      window.notificationSocket = io({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      });
      
      const socket = window.notificationSocket;

      socket.on('connect', () => {
        console.log('✔ Socket connected', socket.id);
        // Get current page name
        const pageName = document.title || window.location.pathname.split('/').pop() || 'Page';
        showToast('🔔 Page Loaded', `${pageName} - Socket Connected`);
      });

      socket.on('disconnect', (reason) => {
        console.log('✖️  Socket disconnected', reason);
        showToast('Socket Disconnected', reason || 'disconnected');
      });

      socket.on('error', (error) => {
        console.error('Socket error', error);
        showToast('Socket Error', String(error));
      });

      // Common notification events created by the server
      const events = ['test_notification', 'price_drop_alert', 'order_status_updated', 'new_vendor_added'];
      events.forEach(evt => {
        socket.on(evt, (payload) => {
          console.log('✔ Socket event received:', evt, payload);
          const title = payload && payload.title ? payload.title : evt;
          const message = payload && payload.message ? payload.message : JSON.stringify(payload);
          showToast(title, message);
        });
      });

      console.log('✔ Socket.IO notification listeners initialized');
    } catch (err) {
      console.error('Socket debug init error', err);
      setTimeout(connectSocket, 1000);
    }
  }

  // Try to connect when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(connectSocket, 100);
    });
  } else {
    setTimeout(connectSocket, 100);
  }
})();
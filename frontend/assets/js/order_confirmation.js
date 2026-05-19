// assets/js/order_confirmation.js
import { api } from "./api.js";

// DOM Elements
const orderId = document.getElementById("orderId");
const orderDate = document.getElementById("orderDate");
const orderItems = document.getElementById("orderItems");
const deliveryAddress = document.getElementById("deliveryAddress");
const paymentMethod = document.getElementById("paymentMethod");
const paymentStatus = document.getElementById("paymentStatus");
const totalAmount = document.getElementById("totalAmount");
const estimatedDelivery = document.getElementById("estimatedDelivery");
const orderStatus = document.getElementById("orderStatus");

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Order confirmation page loaded");
  
  // Get current order from localStorage
  const currentOrder = JSON.parse(localStorage.getItem("currentOrder") || "null");
  
  if (!currentOrder) {
    // If no current order, try to get from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('orderId');
    
    if (orderIdFromUrl) {
      // First, try to find order in localStorage
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      let order = orders.find(o => o._id === orderIdFromUrl);
      
      if (order) {
        displayOrderDetails(order);
      } else {
        // If not in localStorage, try to fetch from backend API
        try {
          console.log("Fetching order from backend:", orderIdFromUrl);
          const response = await api(`/orders/${orderIdFromUrl}`, "GET", null, true);
          console.log("Order fetched:", response);
          if (response.order) {
            displayOrderDetails(response.order);
          } else {
            throw new Error("Order not found in response");
          }
        } catch (error) {
          console.error("Error fetching order:", error);
          alert("Order not found!");
          window.location.href = "orders.html";
        }
      }
    } else {
      alert("No order information found!");
      window.location.href = "marketplace.html";
    }
  } else {
    displayOrderDetails(currentOrder);
    // Clear current order after displaying
    localStorage.removeItem("currentOrder");
  }
});

// Display order details
function displayOrderDetails(order) {
  console.log("Displaying order:", order);
  
  // Order ID and Date
  orderId.textContent = order._id || "N/A";
  orderDate.textContent = order.createdAt ? 
    new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : "N/A";
  
  // Order Status
  updateOrderStatus(order.orderStatus || 'Placed');
  
  // Order Items
  if (order.items && order.items.length > 0) {
    orderItems.innerHTML = order.items.map(item => `
      <div class="flex justify-between items-center py-3 border-b">
        <div class="flex-1">
          <div class="font-semibold">${item.name}</div>
          <div class="text-sm text-gray-500">${item.supplierName || 'Supplier'}</div>
          <div class="text-sm text-gray-500">Qty: ${item.quantity} × ₹${item.price}</div>
        </div>
        <div class="text-right font-semibold">
          ₹${item.price * item.quantity}
        </div>
      </div>
    `).join('');
  } else {
    orderItems.innerHTML = '<div class="text-gray-500">No items found</div>';
  }
  
  // Delivery Address
  if (order.deliveryAddress) {
    const addr = order.deliveryAddress;
    deliveryAddress.innerHTML = `
      <div class="font-semibold">${addr.fullName}</div>
      <div class="text-sm text-gray-600">${addr.phoneNumber}</div>
      <div class="text-sm">${addr.streetAddress}</div>
      <div class="text-sm">${addr.city}, ${addr.state} - ${addr.pincode}</div>
    `;
  } else {
    deliveryAddress.innerHTML = '<div class="text-gray-500">Address not available</div>';
  }
  
  // Payment Information
  paymentMethod.textContent = getPaymentMethodText(order.paymentMethod);
  paymentStatus.textContent = order.paymentStatus || 'Pending';
  
  // Update payment status color
  if (order.paymentStatus === 'Paid') {
    paymentStatus.className = 'font-semibold text-green-600';
  } else if (order.paymentStatus === 'Pending') {
    paymentStatus.className = 'font-semibold text-yellow-600';
  } else {
    paymentStatus.className = 'font-semibold text-red-600';
  }
  
  // Total Amount
  totalAmount.textContent = order.totalAmount || 0;
  
  // Estimated Delivery
  if (order.estimatedDelivery) {
    const deliveryDate = new Date(order.estimatedDelivery);
    estimatedDelivery.textContent = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}

// Get payment method display text
function getPaymentMethodText(method) {
  const methods = {
    'card': 'Credit/Debit Card',
    'upi': 'UPI',
    'netbanking': 'Net Banking',
    'cod': 'Cash on Delivery',
    'wallet': 'Wallet'
  };
  return methods[method] || method;
}

// Update order status display
function updateOrderStatus(status) {
  orderStatus.textContent = status;
  
  // Update status color based on status
  orderStatus.className = 'px-3 py-1 rounded-lg text-sm font-semibold';
  
  switch (status) {
    case 'Placed':
      orderStatus.className += ' bg-blue-100 text-blue-700';
      break;
    case 'Confirmed':
      orderStatus.className += ' bg-green-100 text-green-700';
      break;
    case 'Processing':
      orderStatus.className += ' bg-yellow-100 text-yellow-700';
      break;
    case 'Shipped':
      orderStatus.className += ' bg-purple-100 text-purple-700';
      break;
    case 'Delivered':
      orderStatus.className += ' bg-green-100 text-green-700';
      break;
    case 'Cancelled':
      orderStatus.className += ' bg-red-100 text-red-700';
      break;
    default:
      orderStatus.className += ' bg-gray-100 text-gray-700';
  }
}

// Print order function
window.printOrder = function() {
  window.print();
};

// Track order function
window.trackOrder = function() {
  window.location.href = `order_tracking.html?orderId=${orderId.textContent}`;
};

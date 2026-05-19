// assets/js/payment_gateway.js
import { api } from "./api.js";

// DOM Elements
const paymentOrderId = document.getElementById("paymentOrderId");
const paymentItems = document.getElementById("paymentItems");
const paymentTotal = document.getElementById("paymentTotal");
const payNowButton = document.getElementById("payNowButton");
const paymentModal = document.getElementById("paymentModal");

// State
let currentOrder = null;
let urlParams = new URLSearchParams(window.location.search);

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Payment gateway page loaded");
  
  const orderId = urlParams.get('orderId');
  const amount = urlParams.get('amount');
  
  if (!orderId || !amount) {
    alert("Invalid payment request!");
    window.location.href = "checkout.html";
    return;
  }
  
  // Load order details
  loadOrderDetails(orderId, amount);
  
  // Setup payment button
  payNowButton.addEventListener("click", processPayment);
});

// Load order details
async function loadOrderDetails(orderId, amount) {
  try {
    // Try to get order from localStorage first
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    currentOrder = orders.find(o => o._id === orderId);
    
    if (!currentOrder) {
      // Create mock order if not found
      currentOrder = {
        _id: orderId,
        items: [
          { name: "Sample Product", quantity: 1, price: amount, supplierName: "Sample Supplier" }
        ],
        totalAmount: Number(amount),
        paymentStatus: "Pending"
      };
    }
    
    // Display order details
    displayOrderDetails();
    
  } catch (error) {
    console.error("Failed to load order details:", error);
    alert("Failed to load order details");
    window.location.href = "checkout.html";
  }
}

// Display order details
function displayOrderDetails() {
  paymentOrderId.textContent = currentOrder._id;
  paymentTotal.textContent = currentOrder.totalAmount;
  
  if (currentOrder.items && currentOrder.items.length > 0) {
    paymentItems.innerHTML = currentOrder.items.map(item => `
      <div class="flex justify-between items-center py-2 border-b">
        <div>
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
    paymentItems.innerHTML = '<div class="text-gray-500">No items found</div>';
  }
}

// Process payment
async function processPayment() {
  const paymentMethod = document.querySelector('input[name="paymentGateway"]:checked').value;
  
  console.log("Processing payment with method:", paymentMethod);
  
  try {
    paymentModal.classList.remove("hidden");
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update order payment status
    await updatePaymentStatus(paymentMethod);
    
    // Show success message
    showPaymentSuccess();
    
    // Redirect to order confirmation
    setTimeout(() => {
      window.location.href = `order_confirmation.html?orderId=${currentOrder._id}`;
    }, 2000);
    
  } catch (error) {
    paymentModal.classList.add("hidden");
    console.error("Payment failed:", error);
    alert("Payment failed. Please try again.");
  }
}

// Update payment status
async function updatePaymentStatus(paymentMethod) {
  try {
    // Try to update via backend API
    await api(`/orders/${currentOrder._id}/payment`, "PUT", {
      paymentMethod: paymentMethod,
      paymentStatus: "Paid",
      paymentId: "pay_" + Date.now()
    }, true);
  } catch (error) {
    console.log("Backend update failed, updating locally");
    
    // Update locally
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const orderIndex = orders.findIndex(o => o._id === currentOrder._id);
    
    if (orderIndex !== -1) {
      orders[orderIndex].paymentStatus = "Paid";
      orders[orderIndex].paymentMethod = paymentMethod;
      orders[orderIndex].paidAt = new Date().toISOString();
      localStorage.setItem("orders", JSON.stringify(orders));
    }
    
    // Update current order
    currentOrder.paymentStatus = "Paid";
    currentOrder.paymentMethod = paymentMethod;
    currentOrder.paidAt = new Date().toISOString();
  }
}

// Show payment success
function showPaymentSuccess() {
  paymentModal.innerHTML = `
    <div class="text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      </div>
      <h3 class="text-xl font-semibold mb-2 text-green-600">Payment Successful!</h3>
      <p class="text-gray-500">Your payment has been processed successfully.</p>
      <p class="text-sm text-gray-400 mt-2">Redirecting to order confirmation...</p>
    </div>
  `;
}

// Mock Razorpay integration (for development)
function initializeRazorpay() {
  if (typeof Razorpay !== 'undefined') {
    const options = {
      key: "rzp_test_1234567890", // Test key
      amount: currentOrder.totalAmount * 100, // Amount in paise
      currency: "INR",
      name: "VendorLink",
      description: "Order Payment",
      order_id: "order_" + Date.now(),
      handler: function (response) {
        console.log("Payment successful:", response);
        updatePaymentStatus("razorpay");
        showPaymentSuccess();
        setTimeout(() => {
          window.location.href = `order_confirmation.html?orderId=${currentOrder._id}`;
        }, 2000);
      },
      prefill: {
        name: "Customer Name",
        email: "customer@example.com",
        contact: "9999999999"
      },
      theme: {
        color: "#d97706"
      }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
  } else {
    // Fallback for development
    processPayment();
  }
}

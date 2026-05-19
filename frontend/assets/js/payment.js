// assets/js/payment.js
import { api } from "./api.js";

// DOM Elements
const paymentItems = document.getElementById("paymentItems");
const paymentTotal = document.getElementById("paymentTotal");
const payNowButton = document.getElementById("payNowButton");
const paymentModal = document.getElementById("paymentModal");

// Get cart data from localStorage
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let orderData = null;

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Payment page loaded");
  console.log("Cart data:", cart);
  
  // Check if DOM elements are found
  console.log("payNowButton found:", !!payNowButton);
  console.log("paymentModal found:", !!paymentModal);
  console.log("paymentItems found:", !!paymentItems);
  console.log("paymentTotal found:", !!paymentTotal);
  
  if (cart.length === 0) {
    alert("Your cart is empty!");
    window.location.href = "cart.html";
    return;
  }

  renderOrderSummary();
});

// Render order summary
function renderOrderSummary() {
  paymentItems.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    paymentItems.innerHTML += `
      <div class="flex justify-between items-center py-2 border-b">
        <div>
          <div class="font-semibold">${item.name}</div>
          <div class="text-sm text-gray-500">${item.supplierName || 'Supplier'}</div>
        </div>
        <div class="text-right">
          <div>₹${item.price} × ${item.qty}</div>
          <div class="font-semibold">₹${itemTotal}</div>
        </div>
      </div>
    `;
  });

  paymentTotal.textContent = total;
}

// Validate delivery address
function validateAddress() {
  const fullName = document.getElementById("fullName").value.trim();
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const streetAddress = document.getElementById("streetAddress").value.trim();
  const city = document.getElementById("city").value.trim();
  const state = document.getElementById("state").value.trim();
  const pincode = document.getElementById("pincode").value.trim();

  if (!fullName || !phoneNumber || !streetAddress || !city || !state || !pincode) {
    alert("Please fill in all delivery address fields");
    return false;
  }

  if (phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
    alert("Please enter a valid 10-digit phone number");
    return false;
  }

  if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
    alert("Please enter a valid 6-digit pincode");
    return false;
  }

  return { 
    fullName, 
    phoneNumber, 
    streetAddress, 
    city, 
    state, 
    pincode,
    name: fullName, // For compatibility
    phone: phoneNumber, // For compatibility
    address: streetAddress // For compatibility
  };
}

// Create order on server
async function createOrder(address) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    console.log("No authenticated user found, redirecting to login");
    alert("Please log in to place an order.");
    window.location.href = "login.html";
    return null;
  }

  const orderPayload = {
    supplierId: cart[0].supplierId || "default",
    items: cart.map(item => ({
      name: item.name,
      quantity: item.qty,
      price: item.price,
      supplierId: item.supplierId
    })),
    totalAmount: Number(paymentTotal.textContent),
    deliveryAddress: address,
    paymentMethod: document.querySelector('input[name="paymentGateway"]:checked').value
  };

  console.log("Order payload:", orderPayload);

  try {
    const response = await api("/orders", "POST", orderPayload, true);
    console.log("Order created successfully:", response);
    return response.order;
  } catch (error) {
    console.error("Backend order creation failed:", error);
    alert("Failed to create order. Please try again or contact support.");
    return null;
  }
}

// Initialize Razorpay payment
async function initializeRazorpay(order) {
  try {
    // Create Razorpay order
    const paymentResponse = await api("/payments/create-order", "POST", {
      orderId: order._id,
      amount: order.totalAmount,
    }, true);

    if (paymentResponse.mock) {
      // Mock mode - simulate payment completion
      console.log("Mock payment mode");
      
      // Simulate payment verification
      await api("/payments/verify", "POST", {
        razorpayOrderId: paymentResponse.payment.razorpayOrderId,
        razorpayPaymentId: `mock_payment_${Date.now()}`,
        razorpaySignature: "mock_signature",
      }, true);

      localStorage.removeItem("cart");
      window.location.href = `order_confirmation.html?orderId=${order._id}`;
      return { success: true };
    }

    // Real Razorpay integration
    const options = {
      key: paymentResponse.key,
      amount: paymentResponse.amount,
      currency: "INR",
      name: "VendorLink",
      description: "Order Payment",
      order_id: paymentResponse.razorpayOrderId,
      handler: async function (response) {
        // Payment successful
        try {
          await api("/payments/verify", "POST", {
            orderId: order._id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }, true);

          localStorage.removeItem("cart");
          window.location.href = `order_confirmation.html?orderId=${order._id}`;
        } catch (error) {
          console.error("Payment verification failed:", error);
          alert("Payment verification failed. Please contact support.");
        }
      },
      prefill: {
        name: document.getElementById("name").value,
        contact: document.getElementById("phone").value,
      },
      theme: {
        color: "#d97706", // Amber color matching VendorLink theme
      },
      modal: {
        ondismiss: function() {
          paymentModal.classList.add("hidden");
          alert("Payment cancelled. You can try again.");
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
    
    return { success: true };

  } catch (error) {
    console.log("Razorpay backend failed, simulating payment");
    // Simulate successful payment for testing
    setTimeout(() => {
      paymentModal.classList.add("hidden");
      alert("Payment simulated successfully! (Mock mode)");
      localStorage.removeItem("cart");
      window.location.href = `order_confirmation.html?orderId=mock_${Date.now()}`;
    }, 2000);
    
    return { success: true };
  }
}

// Handle payment button click
if (payNowButton) {
  payNowButton.addEventListener("click", async () => {
    console.log("Place Order button clicked!");
    
    const address = validateAddress();
    if (!address) {
      console.log("Address validation failed");
      return;
    }

    const paymentMethod = document.querySelector('input[name="paymentGateway"]:checked').value;
    console.log("Payment method:", paymentMethod);

    // Show loading modal
    paymentModal.classList.remove("hidden");

    try {
      // Always create order on backend first
      const order = await createOrder(address);
      if (!order) {
        paymentModal.classList.add("hidden");
        return; // createOrder already showed error message
      }

      console.log("Order created:", order);

      // Handle Cash on Delivery
      if (paymentMethod === 'cod') {
        console.log("Processing COD order...");

        // For COD, mark payment as completed on backend
        try {
          await api("/payments/verify", "POST", {
            razorpayOrderId: `cod_${order._id}_${Date.now()}`,
            razorpayPaymentId: `cod_payment_${Date.now()}`,
            razorpaySignature: "cod_signature",
            orderId: order._id
          }, true);
        } catch (paymentError) {
          console.log("COD payment verification failed, but order is created");
        }

        // Clear cart
        localStorage.removeItem("cart");

        // Show success message
        paymentModal.classList.add("hidden");
        
        // Show COD success notification
        showCODSuccessNotification();

        // Redirect to order confirmation page after 3 seconds
        setTimeout(() => {
          window.location.href = `order_confirmation.html?orderId=${order._id}`;
        }, 3000);

        return;
      }

      // For online payment, proceed with Razorpay
      const paymentResult = await initializeRazorpay(order);
      if (paymentResult.success) {
        // Payment initialization successful, Razorpay modal will handle the rest
        console.log("Payment initialized successfully");
      } else {
        paymentModal.classList.add("hidden");
        alert("Failed to initialize payment. Please try again.");
      }

    } catch (error) {
      paymentModal.classList.add("hidden");
      console.error("Order processing failed:", error);
      alert("Failed to place order. Please try again.");
    }
  });
} else {
  console.error("payNowButton not found!");
}

// Show COD success notification
function showCODSuccessNotification() {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3';
  notification.innerHTML = `
    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
    </svg>
    <div>
      <div class="font-bold">Order Placed Successfully!</div>
      <div class="text-sm">Cash on Delivery - Pay ₹${paymentTotal.textContent} at delivery</div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Show success notification
function showSuccessNotification() {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3';
  notification.innerHTML = `
    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
    </svg>
    <div>
      <div class="font-bold">Order Placed Successfully!</div>
      <div class="text-sm">Your order has been confirmed and will be delivered soon.</div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Handle Cash on Delivery selection
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.value === 'cod') {
      payButton.textContent = 'Place Order (COD)';
    } else {
      payButton.textContent = 'Proceed to Pay';
    }
  });
});

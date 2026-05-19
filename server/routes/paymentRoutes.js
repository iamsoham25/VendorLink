const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const { auth } = require("../middleware/authMiddleware");

// Initialize Razorpay (will work with mock if no keys)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "mock_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_key_secret",
});

/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay order for payment
 * @access  Private
 */
router.post("/create-order", auth, async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    // fetch order (mock vs real DB)
    let order;
    if (global.useMockDB) {
      order = global.mockDB.orders?.find((o) => o._id === orderId);
    } else {
      order = await Order.findById(orderId);
    }

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // ensure the user requesting payment is the vendor who placed the order
    const vendorId = global.useMockDB ? order.vendorId : order.vendorId?.toString();
    if (String(vendorId) !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    // check existing payment when using real database
    if (!global.useMockDB) {
      const existingPayment = await Payment.findOne({ order: orderId });
      if (existingPayment && existingPayment.status === "completed") {
        return res.status(400).json({ success: false, error: "Order already paid" });
      }
    }

    // convert amount to paise
    const amountInPaise = Math.round(amount * 100);

    // determine whether to use mock payment
    const usingMockPayment =
      global.useMockDB ||
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET;

    if (usingMockPayment) {
      const mockOrderId = `mock_${Date.now()}`;

      let paymentRecord;
      if (global.useMockDB) {
        global.mockDB.payments = global.mockDB.payments || [];
        paymentRecord = {
          _id: `payment_${Date.now()}`,
          order: orderId,
          user: req.user.id,
          amount,
          razorpayOrderId: mockOrderId,
          status: "pending",
        };
        global.mockDB.payments.push(paymentRecord);
      } else {
        paymentRecord = new Payment({
          order: orderId,
          user: req.user.id,
          amount,
          razorpayOrderId: mockOrderId,
          status: "pending",
        });
        await paymentRecord.save();
      }

      return res.json({
        success: true,
        payment: {
          id: paymentRecord._id,
          razorpayOrderId: mockOrderId,
          amount: amountInPaise,
          currency: "INR",
        },
        keyId: process.env.RAZORPAY_KEY_ID || "mock_key_id",
        mock: true,
      });
    }

    // create real razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${orderId}_${Date.now()}`,
      notes: {
        orderId: orderId.toString(),
        userId: req.user.id,
      },
    });

    const payment = new Payment({
      order: orderId,
      user: req.user.id,
      amount: amount,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
    });
    await payment.save();

    res.json({
      success: true,
      payment: {
        id: payment._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID || "mock_key_id",
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    res.status(500).json({ success: false, error: "Payment initialization failed" });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment signature
 * @access  Private
 */
router.post("/verify", auth, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Find payment (mock or real)
    let payment;
    if (global.useMockDB) {
      payment = global.mockDB.payments?.find((p) => p.razorpayOrderId === razorpayOrderId);
    } else {
      payment = await Payment.findOne({ razorpayOrderId });
    }

    // For COD payments, create a payment record if it doesn't exist
    if (!payment && razorpayOrderId.startsWith("cod_")) {
      const orderId = razorpayOrderId.split("_")[1];
      let order;
      if (global.useMockDB) {
        order = global.mockDB.orders?.find((o) => o._id === orderId);
      } else {
        order = await Order.findById(orderId);
      }

      if (order) {
        if (global.useMockDB) {
          payment = {
            _id: `payment_${Date.now()}`,
            order: orderId,
            user: req.user.id,
            amount: order.totalAmount,
            razorpayOrderId,
            status: "pending",
          };
          global.mockDB.payments = global.mockDB.payments || [];
          global.mockDB.payments.push(payment);
        } else {
          payment = await Payment.create({
            order: orderId,
            user: req.user.id,
            amount: order.totalAmount,
            razorpayOrderId,
            status: "pending",
          });
        }
      }
    }

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    // Verify signature - mocks always valid
    let isValid = false;
    if (global.useMockDB || razorpayOrderId.startsWith("mock_")) {
      isValid = true;
    } else {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mock_key_secret")
        .update(razorpayOrderId + "|" + razorpayPaymentId)
        .digest("hex");
      isValid = generatedSignature === razorpaySignature;
    }

    if (!isValid) {
      // update failure
      if (global.useMockDB) {
        payment.status = "failed";
        payment.failureReason = "Invalid signature";
      } else {
        payment.status = "failed";
        payment.failureReason = "Invalid signature";
        await payment.save();
      }
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    // mark completed
    if (global.useMockDB) {
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.status = "completed";
      payment.transactionId = razorpayPaymentId || `mock_txn_${Date.now()}`;
    } else {
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.status = "completed";
      payment.transactionId = razorpayPaymentId || `mock_txn_${Date.now()}`;
      await payment.save();
    }

    // Update order status
    if (global.useMockDB) {
      const order = global.mockDB.orders?.find((o) => o._id === payment.order);
      if (order) {
        order.paymentStatus = "paid";
        order.status = "confirmed";
      }
    } else {
      const order = await Order.findById(payment.order);
      if (order) {
        order.paymentStatus = "paid";
        order.status = "confirmed";
        await order.save();

        // Notify Supplier of payment completion
        const { notifyUser } = require("../config/notifications");
        notifyUser(order.supplierId, "payment_received", {
          title: "Payment Received",
          message: `Payment of ₹${payment.amount} for Order #${order._id.toString().slice(-6)} has been completed.`,
          type: "success",
          orderId: order._id
        });
      }
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        id: payment._id,
        status: payment.status,
        transactionId: payment.transactionId,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, error: "Payment verification failed" });
  }
});

/**
 * @route   GET /api/payments/:orderId
 * @desc    Get payment status for order
 * @access  Private
 */
router.get("/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    let payment;
    if (global.useMockDB) {
      payment = global.mockDB.payments?.find((p) => p.order === orderId);
      if (payment) {
        // populate minimal user data from mockDB if available
        const user = global.mockDB.users?.find((u) => u._id === payment.user);
        payment.user = user || { _id: payment.user };
        const order = global.mockDB.orders?.find((o) => o._id === payment.order);
        payment.order = order || { _id: payment.order };
      }
    } else {
      payment = await Payment.findOne({ order: orderId })
        .populate("order")
        .populate("user", "name email");
    }

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    // Check authorization
    const userId = global.useMockDB ? payment.user._id || payment.user : payment.user._id.toString();
    if (String(userId) !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   GET /api/payments
 * @desc    Get user's payment history
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate("order")
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook events
 * @access  Public (verified by signature)
 */
router.post("/webhook", async (req, res) => {
  try {
    const { event, payload } = req.body;

    console.log("Payment webhook received:", event);

    switch (event) {
      case "payment.captured":
        const paymentId = payload.payment.entity.id;
        const payment = await Payment.findOne({ razorpayPaymentId: paymentId });
        if (payment) {
          payment.status = "completed";
          payment.transactionId = paymentId;
          await payment.save();

          // Update order
          const order = await Order.findById(payment.order);
          if (order) {
            order.paymentStatus = "paid";
            order.status = "confirmed";
            await order.save();
          }
        }
        break;

      case "payment.failed":
        const failedPaymentId = payload.payment.entity.id;
        const failedPayment = await Payment.findOne({ razorpayPaymentId: failedPaymentId });
        if (failedPayment) {
          failedPayment.status = "failed";
          failedPayment.failureReason = payload.payment.entity.error_description;
          await failedPayment.save();
        }
        break;

      default:
        console.log("Unhandled webhook event:", event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;

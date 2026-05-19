// server/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Requirement = require("../models/Requirement");
const { auth } = require("../middleware/authMiddleware");

// -------------------------------------------------------------
// PLACE ORDER (Vendor)
// -------------------------------------------------------------
router.post("/", auth, async (req, res) => {
  try {
    const { supplierId, items, totalAmount, deliveryAddress, paymentMethod } = req.body;

    if (!supplierId || !items || !items.length) {
      return res
        .status(400)
        .json({ message: "supplierId and at least one item are required" });
    }

    // If using mock DB just push to in-memory store
    if (global.useMockDB) {
      const order = {
        _id: `order_${Date.now()}`,
        vendorId: req.user.id,
        supplierId,
        items,
        totalAmount,
        deliveryAddress,
        paymentMethod: paymentMethod || "card",
        paymentStatus: paymentMethod === "cod" ? "Pending" : "Pending",
        status: "Pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      global.mockDB.orders = global.mockDB.orders || [];
      global.mockDB.orders.push(order);
      return res.json({ message: "Order placed successfully", order });
    }

    const order = await Order.create({
      vendorId: req.user.id,
      supplierId,
      items,
      totalAmount,
      deliveryAddress,
      paymentMethod: paymentMethod || "card",
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Pending",
    });

    // Notify Supplier of new order
    const { notifyUser } = require("../config/notifications");
    notifyUser(supplierId, "new_order", {
      title: "New Order Received!",
      message: `You have a new order from ${req.user.name || "a Vendor"} for ₹${totalAmount}`,
      type: "order",
      orderId: order._id
    });

    // Create a Requirement from this order so suppliers can see it under Requirements
    try {
      const itemsSummary = items.map(i => `${i.quantity} x ${i.name}`).join(", ");
      const title = items.length === 1 ? `Order: ${items[0].name}` : `Order: ${items.length} items`;

      const deliveryAddress = req.body.deliveryAddress || {};
      const deliveryLocation = [deliveryAddress.city, deliveryAddress.state]
        .filter(Boolean)
        .join(", ");

      const vendorLocation =
        deliveryLocation ||
        req.user.location ||
        req.user.address ||
        req.user.city ||
        "Location not specified";

      const requirementData = {
        vendorId: req.user.id,
        title,
        vendorName: req.user.name || req.user.shopName || "Vendor",
        vendorLocation,
        material: items.map(i => i.name).join(", "),
        quantity: items.map(i => `${i.quantity} pcs`).join(", "),
        budget: totalAmount,
        requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        urgency: "normal",
        description: `Order placed with ${items.length} item(s): ${itemsSummary}`,
        requirementsList: itemsSummary,
        verified: false,
        status: "open"
      };

      if (global.useMockDB) {
        global.mockDB.requirements = global.mockDB.requirements || [];
        global.mockDB.requirements.push({
          _id: `req_${Date.now()}`,
          postedDate: new Date(),
          ...requirementData
        });
      } else {
        const newRequirement = await Requirement.create(requirementData);
        const io = req.app.get("io");
        if (io) {
          io.emit("new_requirement", {
            requirement: newRequirement,
            title: "New Opportunity!",
            message: `New requirement created from order by ${requirementData.vendorName}`,
            timestamp: new Date()
          });
        }
      }
    } catch (reqErr) {
      console.error("Failed to create requirement from order:", reqErr.message);
    }

    res.json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("Order place error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET SINGLE ORDER BY ID
// -------------------------------------------------------------
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // If using mock DB
    if (global.useMockDB) {
      const order = global.mockDB.orders?.find((o) => o._id === id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      return res.json({ order });
    }

    // Fetch from real database
    const order = await Order.findById(id)
      .populate("supplierId", "name shopName location")
      .populate("vendorId", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ order });
  } catch (err) {
    console.error("Get order error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET ORDERS FOR VENDOR (My Orders page)
// -------------------------------------------------------------
router.get("/vendor", auth, async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.user.id })
      .populate("supplierId", "name shopName location")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Vendor orders error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET ORDERS FOR SUPPLIER (Supplier Dashboard)
// -------------------------------------------------------------
router.get("/supplier", auth, async (req, res) => {
  try {
    const orders = await Order.find({ supplierId: req.user.id })
      .populate("vendorId", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Supplier orders error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// UPDATE ORDER STATUS (Supplier only)
// -------------------------------------------------------------
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (
      !["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(
        status
      )
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Get the order
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Supplier validation
    if (String(order.supplierId) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this order" });
    }

    // Update status
    order.status = status;
    await order.save();

    // Notify Vendor of status change
    const { notifyUser } = require("../config/notifications");
    notifyUser(order.vendorId, "order_status_updated", {
      title: "Order Update",
      message: `Your order #${order._id.toString().slice(-6)} is now ${status}`,
      type: "order",
      orderId: order._id
    });

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Update status error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

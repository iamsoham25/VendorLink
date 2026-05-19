/**
 * Socket.IO Integration Examples
 * File: examples/notificationExamples.js
 * 
 * Shows how to use notifications in controllers and route handlers
 * Copy patterns from this file into your actual controller files
 */

const { notifyUser, notifyUsers, notifyAll } = require("../config/notifications");

// ============================================================================
// EXAMPLE 1: New Vendor Added - Notify All Users
// ============================================================================
// Location: controllers/vendorController.js (in createVendor function)
// Trigger: When a new vendor is created

const example_newVendorAdded = async (req, res) => {
  try {
    const vendorData = req.body;
    // ... vendor creation logic ...

    // After vendor is saved to database:
    const newVendor = await Vendor.findById(vendorId);

    // Notify all users about new vendor
    notifyAll("new_vendor_added", {
      vendorId: newVendor._id,
      vendorName: newVendor.shopName,
      category: newVendor.category,
      location: newVendor.location,
      rating: newVendor.rating,
      message: `New vendor added: ${newVendor.shopName}`,
    });

    // Also notify users subscribed to this category
    const categoryRoom = `category_${newVendor.category}`;
    // The room notification happens via io.to(categoryRoom).emit()

    res.json({
      success: true,
      message: "Vendor created and notification sent",
      vendor: newVendor,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// EXAMPLE 2: Order Status Updated - Notify Specific User
// ============================================================================
// Location: controllers/orderController.js (in updateOrderStatus function)
// Trigger: When order status changes (processing, shipped, delivered, etc.)

const example_orderStatusUpdated = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // ... order update logic ...
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: status },
      { new: true }
    );

    // Notify the order creator (customer)
    notifyUser(order.userId, "order_status_updated", {
      orderId: order._id,
      status: status,
      vendorName: order.vendorName,
      items: order.items.length,
      message: `Your order status: ${status}`,
      timestamp: new Date(),
    });

    // Also notify vendor about order status if it's from their side
    notifyUser(order.vendorId, "order_status_updated", {
      orderId: order._id,
      status: status,
      customerName: order.customerName,
      items: order.items.length,
      message: `Order ${orderId} is now ${status}`,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Order updated and notification sent",
      order: order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// EXAMPLE 3: Price Drop Alert - Notify Category Subscribers
// ============================================================================
// Location: controllers/productController.js (in updatePrice function)
// Trigger: When Flask ML detects price drop or admin updates price

const example_priceDropAlert = async (req, res) => {
  try {
    const { productId, newPrice, oldPrice } = req.body;

    // ... price update logic ...
    const product = await Product.findByIdAndUpdate(
      productId,
      { price: newPrice },
      { new: true }
    ).populate("category");

    const priceDropPercentage = (
      ((oldPrice - newPrice) / oldPrice) * 100
    ).toFixed(2);

    // Only notify if price actually dropped
    if (newPrice < oldPrice) {
      // Notify all users
      notifyAll("price_drop_alert", {
        productId: product._id,
        productName: product.name,
        category: product.category.name,
        oldPrice: oldPrice,
        newPrice: newPrice,
        discountPercentage: priceDropPercentage,
        message: `Price drop! ${product.name} now ₹${newPrice} (was ₹${oldPrice})`,
        timestamp: new Date(),
      });

      // Also notify category subscribers specifically
      const io = global.io || req.app.get("io");
      if (io) {
        io.to(`category_${product.category._id}`).emit("price_drop_alert", {
          productId: product._id,
          productName: product.name,
          oldPrice: oldPrice,
          newPrice: newPrice,
          discountPercentage: priceDropPercentage,
          message: `${product.name} price dropped to ₹${newPrice}!`,
        });
      }
    }

    res.json({
      success: true,
      message: "Price updated and notifications sent",
      product: product,
      discountPercentage: priceDropPercentage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// EXAMPLE 4: High Demand Alert - Notify When Stock Low
// ============================================================================
// Location: controllers/productController.js (in getProducts function)
// Trigger: When product demand exceeds threshold or stock runs low

const example_highDemandAlert = async (req, res) => {
  try {
    const { productId, demandCount, stockLevel } = req.body;

    // ... demand calculation logic ...
    const product = await Product.findById(productId).populate("supplier");

    const demandThreshold = 50; // If 50+ users are interested
    const stockThreshold = 10; // If less than 10 items in stock

    // Check if high demand
    if (demandCount >= demandThreshold || stockLevel <= stockThreshold) {
      // Notify supplier (vendor)
      notifyUser(product.supplier._id, "high_demand_alert", {
        productId: product._id,
        productName: product.name,
        demandCount: demandCount,
        stockLevel: stockLevel,
        message: `High demand! ${product.name} has ${demandCount} interested buyers and only ${stockLevel} items left`,
        urgency: "high",
        timestamp: new Date(),
      });

      // Notify users watching this vendor
      const io = req.app.get("io");
      if (io) {
        io.to(`vendor_${product.supplier._id}`).emit("high_demand_alert", {
          productId: product._id,
          productName: product.name,
          stockLevel: stockLevel,
          message: `Limited stock! ${product.name} may not be available soon`,
        });
      }
    }

    res.json({
      success: true,
      message: "Demand alert processed",
      product: product,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// EXAMPLE 5: Notify Multiple Users
// ============================================================================
// Location: Any controller where you need to notify a group of users

const example_notifyMultipleUsers = async (req, res) => {
  try {
    const { userIds, event, data } = req.body;

    // Notify multiple users at once
    const { notifyUsers } = require("../config/notifications");

    const count = notifyUsers(userIds, event, data);

    res.json({
      success: true,
      message: `Notification sent to ${count} users`,
      usersNotified: count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// EXAMPLE 6: Check if User is Online
// ============================================================================
// Location: Any controller where you need to check user connection status

const example_checkUserOnlineStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isUserConnected } = require("../config/notifications");

    const online = isUserConnected(userId);

    res.json({
      userId: userId,
      online: online,
      message: online ? "User is online" : "User is offline",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// INTEGRATION CHECKLIST
// ============================================================================
/*
Copy and adapt the examples above to your actual controllers:

1. NEW VENDOR ADDED:
   - File: controllers/vendorController.js
   - Function: createVendor() or similar
   - Add: notifyAll("new_vendor_added", {...})
   - After: vendor saved to database

2. ORDER STATUS UPDATED:
   - File: controllers/orderController.js
   - Function: updateOrderStatus()
   - Add: notifyUser(order.userId, "order_status_updated", {...})
   - After: order status updated in database

3. PRICE DROP DETECTED:
   - File: controllers/productController.js
   - Function: updatePrice()
   - Add: notifyAll("price_drop_alert", {...})
   - Trigger: Flask ML API or admin update

4. HIGH DEMAND ALERT:
   - File: controllers/productController.js
   - Function: Track demand/purchases
   - Add: notifyUser(vendorId, "high_demand_alert", {...})
   - Trigger: When threshold crossed

5. EMIT IN ROUTES:
   - Can also emit directly in routes if no controller exists
   - Get io from: const io = req.app.get("io");
   - Then use: io.to(userId).emit(event, data);
*/

module.exports = {
  example_newVendorAdded,
  example_orderStatusUpdated,
  example_priceDropAlert,
  example_highDemandAlert,
  example_notifyMultipleUsers,
  example_checkUserOnlineStatus,
};

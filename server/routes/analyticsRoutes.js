const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { auth } = require("../middleware/authMiddleware");
const mockDB = require("../config/mockDB");

/**
 * @route   GET /api/analytics/overview
 * @desc    Get analytics overview for vendor/supplier
 * @access  Private
 */
router.get("/overview", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (global.useMockDB) {
      // Mock fallback
      const mockOrders = mockDB.orders.filter(o => o.supplierId === userId || o.vendorId === userId);

      // If there are no orders in mock DB matching this user, inject some dummy numbers
      // so the UI feels "alive" for testing.
      let totalOrders = mockOrders.length;
      let totalRevenue = mockOrders.reduce((sum, o) => sum + (o.totalPrice || o.total || 0), 0);
      let completedOrders = mockOrders.filter(o => o.status === 'delivered').length;
      let pendingOrders = mockOrders.filter(o => o.status === 'Pending').length;

      if (totalOrders === 0) {
        totalOrders = 24;
        totalRevenue = 12500;
        completedOrders = 20;
        pendingOrders = 4;
      }

      return res.json({
        success: true,
        overview: {
          totalOrders: totalOrders,
          totalRevenue: totalRevenue,
          completedOrders: completedOrders,
          pendingOrders: pendingOrders,
          avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          revenueGrowth: "12.5"
        }
      });
    }

    let query = {};
    const userRole = req.user.role;

    if (userRole === "vendor") {
      query.vendorId = userId;
    } else if (userRole === "supplier") {
      query.supplierId = userId;
    }

    // Get date range from query params
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    query.createdAt = { $gte: startDate };

    // Get orders in date range
    const orders = await Order.find(query).lean();

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedOrders = orders.filter((o) => o.status === "Delivered").length;
    const pendingOrders = orders.filter((o) => o.status === "Pending" || o.status === "Processing").length;

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - parseInt(days));
    const prevQuery = { ...query, createdAt: { $gte: prevStartDate, $lt: startDate } };
    const prevOrders = await Order.find(prevQuery).lean();
    const prevRevenue = prevOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Calculate growth
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    res.json({
      success: true,
      overview: {
        totalOrders,
        totalRevenue,
        completedOrders,
        pendingOrders,
        avgOrderValue,
        revenueGrowth: revenueGrowth.toFixed(1),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   GET /api/analytics/sales-trend
 * @desc    Get sales trend over time
 * @access  Private
 */
router.get("/sales-trend", auth, async (req, res) => {
  try {
    const { days = 30, groupBy = "day" } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let query = { createdAt: { $gte: startDate } };
    if (userRole === "vendor") {
      query.vendorId = userId;
    }

    const orders = await Order.find(query).select("createdAt total status").lean();

    // Group by time period
    const trend = {};
    orders.forEach((order) => {
      let key;
      const date = new Date(order.createdAt);

      if (groupBy === "day") {
        key = date.toISOString().split("T")[0];
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!trend[key]) {
        trend[key] = { orders: 0, revenue: 0 };
      }
      trend[key].orders += 1;
      trend[key].revenue += order.total || 0;
    });

    // Convert to array and sort
    const result = Object.entries(trend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, trend: result });
  } catch (error) {
    console.error("Error fetching sales trend:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/analytics/top-products
 * @desc    Get top selling products
 * @access  Private
 */
router.get("/top-products", auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let query = { createdAt: { $gte: startDate } };
    if (userRole === "vendor") {
      query.vendorId = userId;
    } else if (userRole === "supplier") {
      query.supplierId = userId;
    }

    const orders = await Order.find(query).select("items").lean();

    // Count product sales
    const productStats = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId ? item.productId.toString() : "unknown";
        if (!productStats[productId]) {
          productStats[productId] = { name: item.name || "Unknown Product", quantity: 0, revenue: 0 };
        }
        productStats[productId].quantity += item.quantity || 1;
        productStats[productId].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    // Get product details and sort
    const productIds = Object.keys(productStats);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate("supplier", "name shopName")
      .lean();

    const result = products
      .map((product) => ({
        _id: product._id,
        name: product.name,
        category: product.category,
        image: product.image,
        supplier: product.supplier,
        quantitySold: productStats[product._id.toString()] ? productStats[product._id.toString()].quantity : 0,
        revenue: productStats[product._id.toString()] ? productStats[product._id.toString()].revenue : 0,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, parseInt(limit));

    res.json({ success: true, products: result });
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   GET /api/analytics/customer-insights
 * @desc    Get customer acquisition and retention metrics
 * @access  Private
 */
router.get("/customer-insights", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get all orders
    const orders = await Order.find({
      vendorId: userId,
      createdAt: { $gte: startDate },
    })
      .select("createdAt total")
      .sort({ createdAt: 1 })
      .lean();

    // Calculate customer metrics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Group by month for trend
    const monthlyData = {};
    orders.forEach((order) => {
      const month = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[month]) {
        monthlyData[month] = { orders: 0, spent: 0 };
      }
      monthlyData[month].orders += 1;
      monthlyData[month].spent += order.total || 0;
    });

    // Get previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - parseInt(days));
    const prevOrders = await Order.find({
      vendorId: userId,
      createdAt: { $gte: prevStartDate, $lt: startDate },
    }).lean();

    const prevSpent = prevOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const growth = prevSpent > 0 ? ((totalSpent - prevSpent) / prevSpent) * 100 : 0;

    res.json({
      success: true,
      insights: {
        totalOrders,
        totalSpent,
        avgOrderValue: avgOrderValue.toFixed(2),
        spendingGrowth: growth.toFixed(1),
        monthlyTrend: Object.entries(monthlyData).map(([month, data]) => ({
          month,
          ...data,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching customer insights:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   GET /api/analytics/supplier-performance
 * @desc    Get supplier performance metrics (for vendors)
 * @access  Private
 */
router.get("/supplier-performance", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get orders with supplier info
    const orders = await Order.find({
      buyer: userId,
      createdAt: { $gte: startDate },
    })
      .populate("items.product", "name supplier")
      .lean();

    // Group by supplier
    const supplierStats = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = item.product;
        if (product && product.supplier) {
          const supplierId = product.supplier._id.toString();
          const supplierName = product.supplier.shopName || product.supplier.name;

          if (!supplierStats[supplierId]) {
            supplierStats[supplierId] = {
              supplierId,
              supplierName,
              totalOrders: 0,
              totalSpent: 0,
              productsBought: new Set(),
            };
          }
          supplierStats[supplierId].totalOrders += 1;
          supplierStats[supplierId].totalSpent += (item.price || 0) * (item.quantity || 1);
          supplierStats[supplierId].productsBought.add(product._id.toString());
        }
      });
    });

    // Convert to array
    const result = Object.values(supplierStats).map((s) => ({
      supplierId: s.supplierId,
      supplierName: s.supplierName,
      totalOrders: s.totalOrders,
      totalSpent: s.totalSpent,
      uniqueProducts: s.productsBought.size,
    }));

    // Sort by total spent
    result.sort((a, b) => b.totalSpent - a.totalSpent);

    res.json({ success: true, suppliers: result });
  } catch (error) {
    console.error("Error fetching supplier performance:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get complete dashboard data
 * @access  Private
 */
router.get("/dashboard", auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get overview
    const overviewRes = await getOverview(req, days);
    // Get sales trend
    const trendRes = await getSalesTrend(req, days);
    // Get top products
    const productsRes = await getTopProducts(req, 5);

    res.json({
      success: true,
      dashboard: {
        overview: overviewRes.overview,
        salesTrend: trendRes.trend,
        topProducts: productsRes.products,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Helper functions
async function getOverview(req, days) {
  const userRole = req.user.role;
  const userId = req.user.id;

  let query = {};
  if (userRole === "vendor") {
    query.vendorId = userId;
  } else if (userRole === "supplier") {
    query.supplierId = userId;
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  query.createdAt = { $gte: startDate };

  const orders = await Order.find(query).lean();
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  return { overview: { totalOrders, totalRevenue } };
}

async function getSalesTrend(req, days) {
  const userId = req.user.id;
  const userRole = req.user.role;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  let query = { createdAt: { $gte: startDate } };
  if (userRole === "vendor") {
    query.vendorId = userId;
  } else if (userRole === "supplier") {
    query.supplierId = userId;
  }

  const orders = await Order.find(query).select("createdAt totalAmount").lean();

  const trend = {};
  orders.forEach((order) => {
    const date = order.createdAt.toISOString().split("T")[0];
    if (!trend[date]) {
      trend[date] = { orders: 0, revenue: 0 };
    }
    trend[date].orders += 1;
    trend[date].revenue += order.totalAmount || 0;
  });

  return {
    trend: Object.entries(trend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
  };
}

async function getTopProducts(req, limit) {
  const userId = req.user.id;
  const userRole = req.user.role;

  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  let query = { createdAt: { $gte: startDate } };
  if (userRole === "vendor") {
    query.vendorId = userId;
  } else if (userRole === "supplier") {
    query.supplierId = userId;
  }

  const orders = await Order.find(query).select("items").lean();

  const productStats = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const productId = item.productId ? item.productId.toString() : "unknown";
      if (!productStats[productId]) {
        productStats[productId] = { quantity: 0, revenue: 0 };
      }
      productStats[productId].quantity += item.quantity || 1;
      productStats[productId].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  const productIds = Object.keys(productStats);
  const products = await Product.find({ _id: { $in: productIds } })
    .populate("supplier", "name shopName")
    .lean();

  const result = products
    .map((product) => ({
      _id: product._id,
      name: product.name,
      category: product.category,
      supplier: product.supplier,
      quantitySold: productStats[product._id.toString()] ? productStats[product._id.toString()].quantity : 0,
      revenue: productStats[product._id.toString()] ? productStats[product._id.toString()].revenue : 0,
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit);

  return { products: result };
}

module.exports = router;

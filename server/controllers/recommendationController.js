/**
 * Recommendation Controller
 * Implements Hybrid Recommendation System combining Content-Based and Collaborative Filtering
 * Compatible with both MongoDB and Mock Database
 */

const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");

/**
 * Helper: Get database instance (real or mock)
 */
const getDB = async () => {
  if (global.useMockDB) {
    return global.mockDB;
  }
  return null; // Use Mongoose models
};

/**
 * Utility: Calculate cosine similarity between two vectors
 */
const cosineSimilarity = (vec1, vec2) => {
  if (vec1.length !== vec2.length || vec1.length === 0) return 0;

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
};

/**
 * Utility: Normalize a value to 0-1 range
 */
const normalize = (value, min, max) => {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
};

/**
 * CONTENT-BASED FILTERING
 * Recommends vendors based on:
 * - Same category as user's past orders
 * - Same location as user's purchases
 * - Similar price range
 */
const getContentBasedScore = async (userId, vendor) => {
  try {
    const db = await getDB();

    let userOrders;
    if (db) {
      // Mock database
      userOrders = await db.findOrdersByUserId(userId);
    } else {
      // MongoDB
      userOrders = await Order.find({ userId })
        .populate({
          path: "items",
          populate: {
            path: "productId",
            model: "Product",
            populate: {
              path: "supplier",
              model: "User",
            },
          },
        })
        .lean();
    }

    if (!userOrders || userOrders.length === 0) {
      return 0.5; // New user with no order history
    }

    // Extract user preferences from past orders
    const userCategories = new Set();
    const userLocations = new Set();
    const userPrices = [];

    for (const order of userOrders) {
      // For mock DB
      if (order.vendorId && typeof order.vendorId === 'string') {
        const vendorData = db ? await db.findVendorById(order.vendorId) : null;
        if (vendorData) {
          userCategories.add(vendorData.category);
          userLocations.add(vendorData.location);
          userPrices.push(vendorData.priceRange?.min || 50);
        }
      }
      // For MongoDB would populate items
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.productId) {
            if (item.productId.category) userCategories.add(item.productId.category);
            if (item.productId.supplier?.location) {
              userLocations.add(item.productId.supplier.location);
            }
            if (item.price) userPrices.push(item.price);
          }
        }
      }
    }

    // Create feature vector for user preferences
    const categoryMatch = userCategories.size > 0
      ? vendor.category && userCategories.has(vendor.category) ? 1 : 0
      : 0.5;

    const locationMatch = userLocations.size > 0
      ? vendor.location && userLocations.has(vendor.location) ? 1 : 0
      : 0.5;

    // Price similarity
    let priceSimilarity = 0.5;
    if (userPrices.length > 0) {
      const avgUserPrice = userPrices.reduce((a, b) => a + b, 0) / userPrices.length;
      const minPrice = Math.min(...userPrices);
      const maxPrice = Math.max(...userPrices);

      const vendorAvgPrice = (vendor.priceRange?.min + vendor.priceRange?.max) / 2 || 100;
      if (maxPrice > minPrice) {
        const priceDiff = Math.abs(vendorAvgPrice - avgUserPrice);
        const priceRange = maxPrice - minPrice;
        priceSimilarity = Math.max(0, 1 - priceDiff / (priceRange * 2));
      }
    }

    // Calculate weighted content score
    const contentScore = categoryMatch * 0.5 + locationMatch * 0.3 + priceSimilarity * 0.2;
    return Math.min(1, contentScore);
  } catch (err) {
    console.error("Content-based scoring error:", err);
    return 0.5;
  }
};

/**
 * COLLABORATIVE FILTERING
 * Recommends vendors based on what similar users have ordered
 */
const getCollaborativeScore = async (userId, vendor) => {
  try {
    const db = await getDB();

    let userOrders;
    if (db) {
      userOrders = await db.findOrdersByUserId(userId);
    } else {
      userOrders = await Order.find({ userId }).select("vendorId").lean();
    }

    if (!userOrders || userOrders.length === 0) {
      return 0.5;
    }

    // Get vendors that current user has ordered from
    const userVendors = userOrders.map((o) => 
      typeof o.vendorId === 'string' ? o.vendorId : o.vendorId?.toString?.()
    ).filter(Boolean);

    if (userVendors.length === 0) {
      return 0.5;
    }

    // For mock: count how many other users ordered from this vendor
    if (db) {
      const allOrders = db.orders;
      let sameVendorCount = 0;

      for (const order of allOrders) {
        if (order.userId !== userId && order.vendorId === vendor._id) {
          sameVendorCount++;
        }
      }

      // Normalize by total users
      const totalUsers = new Set(allOrders.map(o => o.userId)).size;
      return Math.min(1, sameVendorCount / Math.max(1, totalUsers));
    }

    // MongoDB logic
    const similarUserOrders = await Order.find({
      vendorId: { $in: userVendors },
      userId: { $ne: userId },
    }).select("userId").lean();

    if (!similarUserOrders || similarUserOrders.length === 0) {
      return 0.5;
    }

    const similarUsers = new Set(similarUserOrders.map(o => o.userId.toString()));
    const vendorOrdersFromSimilarUsers = await Order.countDocuments({
      userId: { $in: Array.from(similarUsers) },
      vendorId: vendor._id,
    });

    return Math.min(1, vendorOrdersFromSimilarUsers / Math.max(1, similarUsers.size));
  } catch (err) {
    console.error("Collaborative filtering error:", err);
    return 0.5;
  }
};

/**
 * HYBRID SCORING
 * Combines content-based (60%) and collaborative (40%) scores
 */
const getHybridScore = async (userId, vendor) => {
  const contentScore = await getContentBasedScore(userId, vendor);
  const collaborativeScore = await getCollaborativeScore(userId, vendor);
  const hybridScore = 0.6 * contentScore + 0.4 * collaborativeScore;
  return Math.min(1, hybridScore);
};

/**
 * Main API: Get Personalized Vendor Recommendations
 * GET /api/recommend/:userId
 */
exports.getRecommendedVendors = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const db = await getDB();
    let user;

    if (db) {
      user = await db.findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    } else {
      user = await User.findById(userId).lean();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    // Fetch all vendors
    let vendors;
    if (db) {
      vendors = await db.findAllVendors();
    } else {
      vendors = await User.find({ role: "supplier" })
        .select("_id shopName location rating contactNumber image")
        .lean();
    }

    if (!vendors || vendors.length === 0) {
      return res.status(200).json({
        message: "No vendors available",
        recommendations: [],
        userId,
      });
    }

    console.log(`📊 Calculating recommendations for user ${userId}...`);

    const vendorScores = [];

    for (const vendor of vendors) {
      const score = await getHybridScore(userId, vendor);

      vendorScores.push({
        _id: vendor._id,
        shopName: vendor.shopName,
        location: vendor.location,
        rating: vendor.rating || 4.5,
        phone: vendor.phone || vendor.contactNumber,
        category: vendor.category,
        description: vendor.description,
        imageUrl: vendor.imageUrl,
        recommendationScore: parseFloat(score.toFixed(3)),
        contentScore: parseFloat((0.6 * (await getContentBasedScore(userId, vendor))).toFixed(3)),
        collaborativeScore: parseFloat((0.4 * (await getCollaborativeScore(userId, vendor))).toFixed(3)),
      });
    }

    // Sort by recommendation score and return top N
    const recommendations = vendorScores
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, parseInt(limit));

    console.log(`✅ Generated ${recommendations.length} recommendations`);

    return res.status(200).json({
      success: true,
      message: "Personalized vendor recommendations",
      userId,
      totalVendorsAnalyzed: vendors.length,
      recommendationsReturned: recommendations.length,
      recommendations,
    });
  } catch (err) {
    console.error("Recommendation error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to generate recommendations",
      details: err.message,
    });
  }
};

/**
 * Additional API: Get Vendor Details with Recommendation Context
 * GET /api/recommend/:userId/vendor/:vendorId
 */
exports.getVendorWithContext = async (req, res) => {
  try {
    const { userId, vendorId } = req.params;
    const db = await getDB();

    let user, vendor;

    if (db) {
      user = await db.findUserById(userId);
      vendor = await db.findVendorById(vendorId);
    } else {
      user = await User.findById(userId).lean();
      vendor = await User.findById(vendorId).lean();
    }

    if (!user || !vendor) {
      return res.status(404).json({ message: "User or vendor not found" });
    }

    // Calculate individual scores
    const contentScore = await getContentBasedScore(userId, vendor);
    const collaborativeScore = await getCollaborativeScore(userId, vendor);
    const hybridScore = 0.6 * contentScore + 0.4 * collaborativeScore;

    return res.status(200).json({
      success: true,
      vendor: {
        _id: vendor._id,
        shopName: vendor.shopName,
        location: vendor.location,
        category: vendor.category,
        rating: vendor.rating || 4.5,
        phone: vendor.phone,
        description: vendor.description,
      },
      recommendationBreakdown: {
        contentBasedScore: parseFloat(contentScore.toFixed(3)),
        collaborativeScore: parseFloat(collaborativeScore.toFixed(3)),
        hybridScore: parseFloat(hybridScore.toFixed(3)),
        explanation: {
          contentBased: "Based on your purchase history and preferences",
          collaborative: "Based on similar users' ordering patterns",
          hybrid: "Combined recommendation score",
        },
      },
    });
  } catch (err) {
    console.error("Vendor context error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to get vendor details",
      details: err.message,
    });
  }
};

/**
 * Utility API: Get Recommendation Statistics
 * GET /api/recommend/stats/:userId
 */
exports.getRecommendationStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await getDB();

    let user, orders;

    if (db) {
      user = await db.findUserById(userId);
      orders = await db.findOrdersByUserId(userId);
    } else {
      user = await User.findById(userId).lean();
      orders = await Order.find({ userId }).lean();
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract user preferences
    const categories = new Set();
    const prices = [];
    const vendorSet = new Set();

    for (const order of orders || []) {
      if (db && order.vendorId) {
        vendorSet.add(order.vendorId);
        const vendorData = await db.findVendorById(order.vendorId);
        if (vendorData) {
          categories.add(vendorData.category);
          prices.push(vendorData.priceRange?.min || 50);
        }
      } else if (order.items) {
        vendorSet.add(order.vendorId?.toString());
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.productId?.category) categories.add(item.productId.category);
            if (item.price) prices.push(item.price);
          }
        }
      }
    }

    // Calculate statistics
    const avgPrice = prices.length > 0 
      ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) 
      : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username || user.name,
        email: user.email,
      },
      orderHistory: {
        totalOrders: orders?.length || 0,
        uniqueVendors: vendorSet.size,
      },
      preferences: {
        favoriteCategories: Array.from(categories),
        priceRange: {
          min: minPrice,
          max: maxPrice,
          average: parseFloat(avgPrice),
        },
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to get recommendation statistics",
      details: err.message,
    });
  }
};

/**
 * Socket.IO Event Handlers
 * File: config/socket.js
 * 
 * Handles all Socket.IO connection events and room management
 * Implements authentication and user joining logic
 */

const jwt = require("jsonwebtoken");
const { notifyUser } = require("./notifications");

/**
 * Initialize Socket.IO event handlers
 * @param {object} io - Socket.IO instance
 */
const initializeSocketHandlers = (io) => {
  // Middleware: Verify JWT token on connection (allow dev mode without auth)
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;

    // Allow connections without auth for development/testing
    if (!token && !userId) {
      console.log(`✔ Socket connected (dev mode, no auth)`);
      socket.userId = `guest_${Math.random().toString(36).substr(2, 9)}`;
      return next();
    }

    // For development/testing with userId only
    if (!token && userId) {
      console.log(`⚠️  Connecting user ${userId} without token (dev mode)`);
      socket.userId = userId;
      return next();
    }

    // Production: Verify JWT token
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id || userId;
        console.log(`✔ Socket authenticated for user: ${socket.userId}`);
        return next();
      } catch (error) {
        console.error(`❌ Socket authentication failed:`, error.message);
        return next(new Error("Authentication error"));
      }
    }

    next();
  });

  /**
   * Connection Event
   * User establishes WebSocket connection
   */
  io.on("connection", (socket) => {
    const userId = socket.userId || socket.handshake.auth.userId;

    if (!userId) {
      console.warn("⚠️  Connection received without userId");
      socket.disconnect();
      return;
    }

    console.log(`\n✔ User connected: ${userId} (Socket ID: ${socket.id})`);

    // Join user-specific room using userId
    // This allows server to send messages to specific users
    socket.join(userId);
    console.log(`📍 User ${userId} joined room: ${userId}`);

    // Emit connection confirmation
    socket.emit("connection_confirmed", {
      success: true,
      userId: userId,
      socketId: socket.id,
      timestamp: new Date(),
      message: "Connected to notification service",
    });

    // Broadcast to all users that someone came online
    socket.broadcast.emit("user_online", {
      userId: userId,
      timestamp: new Date(),
      onlineCount: io.engine.clientsCount,
    });

    /**
     * Custom Event: User subscribes to category alerts
     * Allows users to join rooms for specific categories
     */
    socket.on("subscribe_category", (data) => {
      const { category } = data;
      if (category) {
        socket.join(`category_${category}`);
        console.log(`🏷️  User ${userId} subscribed to category: ${category}`);

        socket.emit("subscription_confirmed", {
          category: category,
          message: `Subscribed to ${category} alerts`,
        });
      }
    });

    /**
     * Custom Event: User unsubscribes from category alerts
     */
    socket.on("unsubscribe_category", (data) => {
      const { category } = data;
      if (category) {
        socket.leave(`category_${category}`);
        console.log(`🏷️  User ${userId} unsubscribed from category: ${category}`);

        socket.emit("unsubscription_confirmed", {
          category: category,
          message: `Unsubscribed from ${category} alerts`,
        });
      }
    });

    /**
     * Custom Event: User subscribes to vendor alerts
     */
    socket.on("subscribe_vendor", (data) => {
      const { vendorId } = data;
      if (vendorId) {
        socket.join(`vendor_${vendorId}`);
        console.log(`🏪 User ${userId} subscribed to vendor: ${vendorId}`);

        socket.emit("vendor_subscription_confirmed", {
          vendorId: vendorId,
          message: `Subscribed to vendor ${vendorId} updates`,
        });
      }
    });

    /**
     * Custom Event: User unsubscribes from vendor alerts
     */
    socket.on("unsubscribe_vendor", (data) => {
      const { vendorId } = data;
      if (vendorId) {
        socket.leave(`vendor_${vendorId}`);
        console.log(`🏪 User ${userId} unsubscribed from vendor: ${vendorId}`);

        socket.emit("vendor_unsubscription_confirmed", {
          vendorId: vendorId,
          message: `Unsubscribed from vendor ${vendorId} updates`,
        });
      }
    });

    /**
     * Custom Event: Manual ping/heartbeat
     * Keeps connection alive and measures latency
     */
    socket.on("ping", (data) => {
      const latency = Date.now() - data.timestamp;
      socket.emit("pong", {
        latency: latency,
        timestamp: new Date(),
      });
    });

    /**
     * Custom Event: User sends message (for future chat feature)
     */
    socket.on("send_message", (data) => {
      const { recipientId, message } = data;

      if (recipientId && message) {
        // Send to specific recipient
        io.to(recipientId).emit("receive_message", {
          senderId: userId,
          message: message,
          timestamp: new Date(),
        });

        // Confirm to sender
        socket.emit("message_sent", {
          recipientId: recipientId,
          timestamp: new Date(),
        });

        console.log(`💬 Message from ${userId} to ${recipientId}`);
      }
    });

    /**
     * Disconnection Event
     * Clean up when user goes offline
     */
    socket.on("disconnect", () => {
      console.log(`✖️  User disconnected: ${userId} (Socket ID: ${socket.id})`);

      // Notify other users that someone went offline
      socket.broadcast.emit("user_offline", {
        userId: userId,
        timestamp: new Date(),
        onlineCount: io.engine.clientsCount,
      });
    });

    /**
     * Error Event
     * Handle socket errors gracefully
     */
    socket.on("error", (error) => {
      console.error(`❌ Socket error for user ${userId}:`, error);
    });
  });

  console.log("✔ Socket.IO handlers initialized");
};

module.exports = {
  initializeSocketHandlers,
};

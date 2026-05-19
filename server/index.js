// ====================
// ENVIRONMENT SETUP
// ====================
require("dotenv").config();
const { validateEnv } = require("./config/env");
validateEnv(); // Validate env vars on startup

// ====================
// IMPORTS
// ====================
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");

// Config imports
const connectDB = require("./config/db");
const logger = require("./config/logger");
const { swaggerSetup } = require("./config/swagger");
const { initializeEmailService } = require("./services/emailService");
const { cacheHelpers } = require("./config/redis");

// Middleware imports
const { errorHandler, notFoundHandler, asyncHandler } = require("./middleware/errorHandler");
const { initializeSocketHandlers } = require("./config/socket");
const { initializeNotifications } = require("./config/notifications");

const app = express();

logger.info("🚀 Starting VendorLink Server...");

// ====================
// SECURITY MIDDLEWARE
// ====================
// Helmet - security headers (with relaxed CSP for Tailwind CDN)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https:", "data:", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "ws:", "wss:", "http://127.0.0.1:5001"],
    },
  },
}));

// CORS - cross-origin resource sharing
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Data sanitization - prevent NoSQL injection
app.use(mongoSanitize());

// Rate limiting - DOS protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased for development
  message: "Too many login attempts, please try again after 15 minutes.",
  skipSuccessfulRequests: true,
});

// ====================
// LOGGING MIDDLEWARE
// ====================
// Morgan HTTP request logger
app.use(morgan((tokens, req, res) => {
  const status = tokens.status(req, res);
  const statusColor = status >= 400 ? "31" : "32"; // Red for errors, Green for success
  return `\x1b[${statusColor}m[${tokens.method(req, res)} ${tokens.url(req, res)} - ${status}] ${tokens['response-time'](req, res)}ms\x1b[0m`;
}));

// ====================
// DATABASE & SERVICES
// ====================
// Connect to MongoDB
connectDB();

// Initialize email service
initializeEmailService();

logger.info("✅ Core services initialized");

// Serve static files from frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// ====================
// API DOCUMENTATION
// ====================
swaggerSetup(app);

// ====================
// API ROUTES
// ====================
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/suppliers", require("./routes/supplierRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/recommend", require("./routes/recommendationRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/marketplace", require("./routes/marketplaceRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

// AI Price Prediction proxy → forwards to Flask on port 5001
app.post("/api/ai/predict", (req, res) => {
  const body = JSON.stringify(req.body);
  const options = {
    hostname: "127.0.0.1",
    port: 5001,
    path: "/predict",
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
  };
  const proxy = http.request(options, (r) => {
    let data = "";
    r.on("data", chunk => data += chunk);
    r.on("end", () => { try { res.json(JSON.parse(data)); } catch(e) { res.status(500).json({ error: "Invalid response from AI service" }); } });
  });
  proxy.on("error", () => res.status(503).json({ error: "AI service unavailable. Make sure Flask is running on port 5001." }));
  proxy.write(body);
  proxy.end();
});

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Initialize Socket.IO handlers and notifications
initializeSocketHandlers(io);
initializeNotifications(io);

// Make io accessible to routes
app.set("io", io);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    connectedClients: io.engine.clientsCount,
  });
});

// Development/test endpoint to emit a Socket.IO notification
// Usage: GET /api/test/notify?message=Hello&title=Hi&type=info
app.get("/api/test/notify", (req, res) => {
  try {
    const ioInstance = req.app.get("io");
    if (!ioInstance) {
      return res.status(500).json({ success: false, error: "Socket.IO not initialized" });
    }

    const payload = {
      title: req.query.title || "Test Notification",
      message: req.query.message || "This is a test notification from the server",
      type: req.query.type || "info",
      timestamp: new Date(),
    };

    // Emit to all connected clients
    ioInstance.sockets.emit("test_notification", payload);
    console.log("Emitted test_notification", payload);

    return res.json({ success: true, emitted: payload });
  } catch (err) {
    console.error("Error emitting test notification:", err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// Development/test endpoint to emit a burst of different Socket.IO notifications
// Usage: GET /api/test/notify-burst?count=1
app.get("/api/test/notify-burst", (req, res) => {
  try {
    const ioInstance = req.app.get("io");
    if (!ioInstance) {
      return res.status(500).json({ success: false, error: "Socket.IO not initialized" });
    }

    const count = Math.max(1, Math.min(10, parseInt(req.query.count || "1", 10)));
    const emitted = [];

    for (let i = 0; i < count; i++) {
      const base = {
        id: `burst_${Date.now()}_${i}`,
        timestamp: new Date(),
      };

      // test_notification
      const testPayload = Object.assign({}, base, {
        title: `Burst Test #${i + 1}`,
        message: `This is burst test notification #${i + 1}`,
        type: "info",
      });
      ioInstance.sockets.emit("test_notification", testPayload);
      emitted.push({ event: "test_notification", payload: testPayload });

      // price_drop_alert
      const priceDrop = Object.assign({}, base, {
        productId: `p_${i + 1}`,
        title: `Price drop: Product ${i + 1}`,
        message: `Price dropped by ${(5 + i)}% — check it out!`,
        type: "price_drop",
        oldPrice: 100 + i * 10,
        newPrice: 90 + i * 9,
      });
      ioInstance.sockets.emit("price_drop_alert", priceDrop);
      emitted.push({ event: "price_drop_alert", payload: priceDrop });

      // order_status_updated
      const orderUpdate = Object.assign({}, base, {
        orderId: `ord_${i + 1}`,
        title: `Order Updated #${i + 1}`,
        message: `Order ord_${i + 1} status changed to Shipped`,
        status: "Shipped",
        type: "order",
      });
      ioInstance.sockets.emit("order_status_updated", orderUpdate);
      emitted.push({ event: "order_status_updated", payload: orderUpdate });

      // new_vendor_added
      const vendorAdded = Object.assign({}, base, {
        vendorId: `vendor_${i + 1}`,
        title: `New Vendor #${i + 1}`,
        message: `Vendor vendor_${i + 1} has joined the platform`,
        type: "vendor",
      });
      ioInstance.sockets.emit("new_vendor_added", vendorAdded);
      emitted.push({ event: "new_vendor_added", payload: vendorAdded });
    }

    console.log(`Emitted ${emitted.length} burst notifications`);
    return res.json({ success: true, emittedCount: emitted.length, emitted });
  } catch (err) {
    console.error("Error emitting burst notifications:", err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// ====================
// ERROR HANDLING
// ====================
// 404 handler - must be before error handler
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// ====================
// SPA ROUTING (Catch-all for frontend) - Must be AFTER error handlers
// ====================
// Serve index.html for all non-API routes (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', { reason, promise });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', { error: error.message });
  process.exit(1);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`\n╔════════════════════════════════════════╗`);
  logger.info(`║  ✔ VendorLink Server Running           ║`);
  logger.info(`║  Port: ${PORT}                              ║`);
  logger.info(`║  Socket.IO: Enabled                    ║`);
  logger.info(`║  Notifications: Active                 ║`);
  logger.info(`║  API Docs: http://localhost:${PORT}/api-docs   ║`);
  logger.info(`╚════════════════════════════════════════╝\n`);
});

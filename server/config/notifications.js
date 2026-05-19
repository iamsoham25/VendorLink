/**
 * Socket.IO Notifications Helper
 * File: config/notifications.js
 * 
 * Provides centralized notification emission functions
 * Used throughout the application to send real-time updates to users
 */

/**
 * Initialize notifications with Socket.IO instance
 * Should be called once when server starts
 */
let io = null;

const initializeNotifications = (socketIOInstance) => {
  io = socketIOInstance;
  console.log("✔ Notifications system initialized");
};

/**
 * Send notification to a specific user
 * @param {string} userId - Target user ID
 * @param {string} event - Event name (e.g., 'order_status_updated')
 * @param {object} data - Notification data
 * @returns {boolean} - True if user is connected, false otherwise
 */
const notifyUser = (userId, event, data) => {
  if (!io) {
    console.warn("⚠️  Socket.IO not initialized");
    return false;
  }

  try {
    // Emit to specific user's room (userId)
    io.to(userId).emit(event, {
      timestamp: new Date(),
      event: event,
      ...data,
    });

    console.log(`📤 Notification sent to user ${userId}: ${event}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending notification to ${userId}:`, error.message);
    return false;
  }
};

/**
 * Send notification to multiple specific users
 * @param {array} userIds - Array of user IDs
 * @param {string} event - Event name
 * @param {object} data - Notification data
 * @returns {number} - Number of users notified
 */
const notifyUsers = (userIds, event, data) => {
  if (!io || !Array.isArray(userIds)) {
    return 0;
  }

  let count = 0;
  userIds.forEach((userId) => {
    if (notifyUser(userId, event, data)) {
      count++;
    }
  });

  return count;
};

/**
 * Send notification to all connected users
 * @param {string} event - Event name
 * @param {object} data - Notification data
 */
const notifyAll = (event, data) => {
  if (!io) {
    console.warn("⚠️  Socket.IO not initialized");
    return;
  }

  try {
    io.emit(event, {
      timestamp: new Date(),
      event: event,
      ...data,
    });

    console.log(`📢 Broadcast notification: ${event}`);
  } catch (error) {
    console.error(`❌ Error broadcasting notification:`, error.message);
  }
};

/**
 * Send notification to all users except one
 * @param {string} excludeUserId - User ID to exclude
 * @param {string} event - Event name
 * @param {object} data - Notification data
 */
const notifyAllExcept = (excludeUserId, event, data) => {
  if (!io) {
    console.warn("⚠️  Socket.IO not initialized");
    return;
  }

  try {
    io.emit(event, {
      timestamp: new Date(),
      event: event,
      userId: excludeUserId,
      ...data,
    });

    console.log(`📢 Broadcast to all except ${excludeUserId}: ${event}`);
  } catch (error) {
    console.error(`❌ Error broadcasting notification:`, error.message);
  }
};

/**
 * Get list of connected users
 * @returns {object} - Object with userId -> socketId mapping
 */
const getConnectedUsers = () => {
  if (!io) return {};

  const connectedUsers = {};
  io.engine.clients.forEach((client) => {
    const userId = client.request._query?.userId;
    if (userId) {
      connectedUsers[userId] = client.id;
    }
  });

  return connectedUsers;
};

/**
 * Check if specific user is connected
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if user is connected
 */
const isUserConnected = (userId) => {
  if (!io) return false;
  const connectedUsers = getConnectedUsers();
  return userId in connectedUsers;
};

/**
 * Get count of connected users
 * @returns {number} - Number of connected users
 */
const getConnectedUserCount = () => {
  return Object.keys(getConnectedUsers()).length;
};

module.exports = {
  initializeNotifications,
  notifyUser,
  notifyUsers,
  notifyAll,
  notifyAllExcept,
  getConnectedUsers,
  isUserConnected,
  getConnectedUserCount,
};

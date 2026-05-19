const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { auth } = require("../middleware/authMiddleware");

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
router.get("/conversations", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate("participants", "name shopName image role location")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    // Format conversations with other participant info
    const formatted = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== req.user.id
      );

      // Get unread count for current user
      const unreadCount = conv.unreadCount?.get(req.user.id) || 0;

      return {
        _id: conv._id,
        otherParticipant,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        order: conv.order,
        product: conv.product,
        createdAt: conv.createdAt,
      };
    });

    res.json({ success: true, conversations: formatted });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   POST /api/chat/conversations
 * @desc    Create or get existing conversation with a user
 * @access  Private
 */
router.post("/conversations", auth, async (req, res) => {
  try {
    const { participantId, orderId, productId } = req.body;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId] },
      ...(orderId && { order: orderId }),
      ...(productId && { product: productId }),
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.id, participantId],
        order: orderId || null,
        product: productId || null,
      });
      await conversation.save();
    }

    // Populate participants
    conversation = await Conversation.findById(conversation._id)
      .populate("participants", "name shopName image role location");

    res.json({ success: true, conversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   GET /api/chat/messages/:conversationId
 * @desc    Get messages for a conversation
 * @access  Private
 */
router.get("/messages/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    // Build query
    const query = { conversation: conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Get messages
    const messages = await Message.find(query)
      .populate("sender", "name shopName image")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.id },
        "readBy.user": { $ne: req.user.id },
      },
      {
        $push: { readBy: { user: req.user.id, readAt: new Date() } },
      }
    );

    // Reset unread count
    conversation.unreadCount.set(req.user.id, 0);
    await conversation.save();

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   POST /api/chat/messages/:conversationId
 * @desc    Send a message
 * @access  Private
 */
router.post("/messages/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = "text" } = req.body;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: req.user.id,
      content,
      messageType,
      readBy: [{ user: req.user.id, readAt: new Date() }],
    });
    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Increment unread count for other participants
    conversation.participants.forEach((p) => {
      if (p.toString() !== req.user.id) {
        const currentCount = conversation.unreadCount.get(p.toString()) || 0;
        conversation.unreadCount.set(p.toString(), currentCount + 1);
      }
    });

    await conversation.save();

    // Populate and return
    await message.populate("sender", "name shopName image");

    // Emit socket event for real-time delivery
    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        if (p.toString() !== req.user.id) {
          io.to(p.toString()).emit("new_message", {
            conversationId,
            message,
          });
        }
      });
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   GET /api/chat/unread
 * @desc    Get total unread message count
 * @access  Private
 */
router.get("/unread", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    });

    let totalUnread = 0;
    conversations.forEach((conv) => {
      totalUnread += conv.unreadCount?.get(req.user.id) || 0;
    });

    res.json({ success: true, unreadCount: totalUnread });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   PUT /api/chat/conversations/:conversationId/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.put("/conversations/:conversationId/read", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    // Mark all messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.id },
        "readBy.user": { $ne: req.user.id },
      },
      {
        $push: { readBy: { user: req.user.id, readAt: new Date() } },
      }
    );

    // Reset unread count
    conversation.unreadCount.set(req.user.id, 0);
    await conversation.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;

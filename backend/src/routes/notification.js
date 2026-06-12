import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications — Get all broadcast notifications for user feed
router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(30)
            .select('title body sentAt createdAt');
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/notifications/push-token — Save/update user's Expo Push Token
router.put('/push-token', authMiddleware, async (req, res) => {
    try {
        const { pushToken } = req.body;
        if (!pushToken) {
            return res.status(400).json({ message: "pushToken is required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Add token if not already present
        if (!user.pushTokens.includes(pushToken)) {
            user.pushTokens.push(pushToken);
            await user.save();
        }

        res.json({ message: "Push token registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

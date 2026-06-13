import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Stats from '../models/Stats.js';
import Expense from '../models/Expense.js';
import Feedback from '../models/Feedback.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/users — List all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
            .select('name email provider role photoUrl emailVerified createdAt lastSeenAt pushTokens')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/stats — Dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        // Active users = users who logged in within the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = await User.countDocuments({
            lastSeenAt: { $gte: thirtyDaysAgo }
        });

        const totalDownloads = await Stats.getValue('apk_downloads');
        const totalInstalls = await Stats.getValue('total_installs');
        const totalNotifications = await Notification.countDocuments();

        // Users with push tokens registered
        const usersWithPush = await User.countDocuments({
            pushTokens: { $exists: true, $not: { $size: 0 } }
        });

        res.json({
            totalUsers,
            activeUsers,
            totalDownloads,
            totalInstalls,
            totalNotifications,
            usersWithPush
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/notifications — Broadcast a notification
router.post('/notifications', async (req, res) => {
    try {
        const { title, body } = req.body;
        if (!title || !body) {
            return res.status(400).json({ message: "Title and body are required" });
        }

        // Get all users with push tokens
        const usersWithTokens = await User.find({
            pushTokens: { $exists: true, $not: { $size: 0 } }
        }).select('pushTokens');

        // Collect all unique tokens
        const allTokens = [];
        for (const user of usersWithTokens) {
            for (const token of user.pushTokens) {
                if (token && !allTokens.includes(token)) {
                    allTokens.push(token);
                }
            }
        }

        // Send via Expo Push API
        let successCount = 0;
        if (allTokens.length > 0) {
            // Expo accepts batches of up to 100
            const chunks = [];
            for (let i = 0; i < allTokens.length; i += 100) {
                chunks.push(allTokens.slice(i, i + 100));
            }

            for (const chunk of chunks) {
                const messages = chunk.map(pushToken => ({
                    to: pushToken,
                    sound: 'default',
                    title,
                    body,
                    data: { type: 'broadcast' }
                }));

                try {
                    const response = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Accept-Encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(messages),
                    });
                    const result = await response.json();
                    if (result.data) {
                        successCount += result.data.filter(r => r.status === 'ok').length;
                    }
                } catch (pushErr) {
                    console.error('Expo push error:', pushErr.message);
                }
            }
        }

        // Save notification to database
        const notifData = {
            title,
            body,
            recipientCount: successCount
        };
        if (mongoose.isValidObjectId(req.user.id)) {
            notifData.sentBy = req.user.id;
        }
        const notification = await Notification.create(notifData);

        res.status(201).json({
            message: `Notification sent to ${successCount} device(s)`,
            notification,
            totalTokens: allTokens.length,
            successCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/notifications — List all sent notifications
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/feedback — List all user feedback
router.get('/feedback', async (req, res) => {
    try {
        const { status, type, platform } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (platform) filter.platform = platform;

        const feedback = await Feedback.find(filter)
            .populate('userId', 'name email photoUrl')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/admin/feedback/:id/status — Update feedback status (resolve/archive)
router.patch('/feedback/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['unread', 'resolved', 'archived'].includes(status)) {
            return res.status(400).json({ message: "Invalid or missing status" });
        }

        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('userId', 'name email photoUrl');

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

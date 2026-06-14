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
        // Backup auto-deletion: delete notifications older than 2 days
        await Notification.deleteMany({ sentAt: { $lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } });
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/notifications/:id — Delete a notification record
router.delete('/notifications/:id', async (req, res) => {
    try {
        const notif = await Notification.findByIdAndDelete(req.params.id);
        if (!notif) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.json({ message: "Notification deleted successfully" });
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
        const { status, resolutionMessage } = req.body;
        if (!status || !['unread', 'resolved', 'archived'].includes(status)) {
            return res.status(400).json({ message: "Invalid or missing status" });
        }

        const updateData = { status };
        if (status === 'resolved') {
            updateData.resolutionMessage = resolutionMessage || '';
            updateData.resolvedAt = new Date();
        }

        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('userId', 'name email photoUrl pushTokens');

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        // If resolved, send push notification and optional email to user
        if (status === 'resolved') {
            const replyMsg = resolutionMessage || 'Thank you! Your feedback has been resolved.';
            
            // 1. Send Push Notification via Expo
            if (feedback.userId && Array.isArray(feedback.userId.pushTokens) && feedback.userId.pushTokens.length > 0) {
                console.log(`[Feedback Resolution] Dispatching push to user: ${feedback.userId.name || 'User'}. Tokens count: ${feedback.userId.pushTokens.length}. Tokens:`, feedback.userId.pushTokens);
                const messages = feedback.userId.pushTokens.map(pushToken => ({
                    to: pushToken,
                    sound: 'default',
                    title: '📢 Feedback Response',
                    body: `Admin replied: "${replyMsg}"`,
                    data: { type: 'feedback_resolved', feedbackId: feedback._id }
                }));

                try {
                    console.log('[Feedback Resolution] Sending push notification to Expo service...');
                    const response = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Accept-Encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(messages),
                    });
                    
                    const resData = await response.json();
                    console.log('[Feedback Resolution] Expo API Response:', JSON.stringify(resData));
                } catch (pushErr) {
                    console.error('[Feedback Resolution] Expo push error for feedback resolution:', pushErr.message);
                }
            } else {
                console.log('[Feedback Resolution] No registered push tokens found for this user. Push notification skipped.');
            }

            // 2. Send optional email using nodemailer
            const userEmail = feedback.email || feedback.userId?.email;
            if (userEmail) {
                if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                    try {
                        const nodemailer = await import('nodemailer');
                        
                        const transportConfig = {
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PASS,
                            }
                        };

                        if (process.env.EMAIL_HOST) {
                            transportConfig.host = process.env.EMAIL_HOST;
                            transportConfig.port = parseInt(process.env.EMAIL_PORT || '587');
                            transportConfig.secure = process.env.EMAIL_SECURE === 'true';
                            console.log(`[Feedback Resolution] Using custom SMTP server config: ${transportConfig.host}:${transportConfig.port} (secure: ${transportConfig.secure})`);
                        } else {
                            transportConfig.service = process.env.EMAIL_SERVICE || 'gmail';
                            console.log(`[Feedback Resolution] Using standard email service config: ${transportConfig.service}`);
                        }

                        const transporter = (nodemailer.default || nodemailer).createTransport(transportConfig);

                        const mailOptions = {
                            from: `"SpendWise Admin" <${process.env.EMAIL_USER}>`,
                            to: userEmail,
                            subject: 'SpendWise Feedback Resolution',
                            text: `Hello,\n\nYour feedback has been resolved by an administrator.\n\nResolution details:\n"${replyMsg}"\n\nThank you for using SpendWise!`,
                            html: `<p>Hello,</p><p>Your feedback has been resolved by an administrator.</p><p><strong>Resolution details:</strong><br/>"${replyMsg}"</p><p>Thank you for using SpendWise!</p>`,
                        };

                        console.log(`[Feedback Resolution] Dispatching resolution email to: ${userEmail}`);
                        const info = await transporter.sendMail(mailOptions);
                        console.log('[Feedback Resolution] Email sent successfully. Info:', info.messageId || info);
                    } catch (emailErr) {
                        console.error('[Feedback Resolution] Nodemailer error for feedback resolution:', emailErr.message);
                    }
                } else {
                    console.warn('[Feedback Resolution] Email resolution skipped: EMAIL_USER and/or EMAIL_PASS environment variables are not defined in .env');
                }
            } else {
                console.log('[Feedback Resolution] No email address associated with this feedback or user. Email skipped.');
            }
        }

        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

import express from 'express';
import jwt from 'jsonwebtoken';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/feedback — Submit user feedback (authenticated or anonymous)
router.post('/', async (req, res) => {
    try {
        const { name, email, type, message, platform } = req.body;

        if (!message || !platform) {
            return res.status(400).json({ message: "Message and platform are required" });
        }

        if (!['web', 'mobile'].includes(platform)) {
            return res.status(400).json({ message: "Platform must be 'web' or 'mobile'" });
        }

        if (type && !['bug', 'feature', 'other'].includes(type)) {
            return res.status(400).json({ message: "Invalid feedback type" });
        }

        const feedbackData = {
            name,
            email,
            type: type || 'other',
            message,
            platform,
            status: 'unread'
        };

        // Optionally associate with authenticated user if token is present
        const token = req.header('Authorization')?.split(' ')[1];
        if (token) {
            try {
                const verified = jwt.verify(token, process.env.JWT_SECRET);
                feedbackData.userId = verified.id;
                // If authenticated, we can grab name/email from req.body or let database references handle details
            } catch (err) {
                // Ignore invalid token, submit as anonymous/provided guest fields
            }
        }

        const feedback = await Feedback.create(feedbackData);

        // Find all admin users with push tokens and notify them
        try {
            const admins = await User.find({
                role: 'admin',
                pushTokens: { $exists: true, $not: { $size: 0 } }
            }).select('pushTokens');

            const allTokens = [];
            for (const admin of admins) {
                for (const token of admin.pushTokens) {
                    if (token && !allTokens.includes(token)) {
                        allTokens.push(token);
                    }
                }
            }

            if (allTokens.length > 0) {
                const senderName = feedbackData.name || feedbackData.email || 'Anonymous';
                const bodyText = `New ${feedbackData.type.toUpperCase()} from ${senderName}: "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"`;
                const messages = allTokens.map(token => ({
                    to: token,
                    sound: 'default',
                    title: '📩 New Feedback Submitted',
                    body: bodyText,
                    data: { type: 'feedback', feedbackId: feedback._id }
                }));

                // Call Expo Push API
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(messages),
                });
            }
        } catch (pushErr) {
            console.error('Failed to notify admins of feedback:', pushErr.message);
        }

        res.status(201).json({
            message: "Feedback submitted successfully",
            feedback
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

import express from 'express';
import jwt from 'jsonwebtoken';
import Feedback from '../models/Feedback.js';

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
        res.status(201).json({
            message: "Feedback submitted successfully",
            feedback
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

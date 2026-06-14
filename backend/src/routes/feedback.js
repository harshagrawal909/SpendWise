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

        // Notify all admin users
        try {
            const admins = await User.find({ role: 'admin' });

            // 1. Send Email Notification to Admins
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                try {
                    const nodemailer = await import('nodemailer');
                    const transporter = (nodemailer.default || nodemailer).createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS,
                        },
                    });

                    const adminEmails = admins.map(a => a.email).filter(Boolean);
                    if (adminEmails.length > 0) {
                        const senderName = feedbackData.name || feedbackData.email || 'Anonymous';
                        const mailOptions = {
                            from: `"SpendWise System" <${process.env.EMAIL_USER}>`,
                            to: adminEmails.join(','),
                            subject: `New SpendWise Feedback: ${feedbackData.type.toUpperCase()}`,
                            text: `Hello Admin,\n\nA new feedback message has been submitted on SpendWise.\n\nFrom: ${senderName} (${feedbackData.email || 'No Email'})\nPlatform: ${feedbackData.platform}\nType: ${feedbackData.type}\nMessage:\n"${message}"\n\nPlease resolve it in the admin portal.`,
                            html: `<p>Hello Admin,</p><p>A new feedback message has been submitted on SpendWise.</p><p><strong>From:</strong> ${senderName} (${feedbackData.email || 'No Email'})<br/><strong>Platform:</strong> ${feedbackData.platform}<br/><strong>Type:</strong> ${feedbackData.type}</p><p><strong>Message:</strong><br/>"${message}"</p><p>Please resolve it in the admin portal.</p>`,
                        };
                        await transporter.sendMail(mailOptions);
                    }
                } catch (emailErr) {
                    console.error('Nodemailer error for admin feedback notification:', emailErr.message);
                }
            }

            // 2. Send Push Notifications to Admins
            const allTokens = [];
            for (const admin of admins) {
                if (Array.isArray(admin.pushTokens)) {
                    for (const token of admin.pushTokens) {
                        if (token && !allTokens.includes(token)) {
                            allTokens.push(token);
                        }
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

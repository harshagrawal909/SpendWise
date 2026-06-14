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
            console.log(`[Feedback System] Found ${admins.length} administrators in the database.`);

            // 1. Send Email Notification to Admins
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
                        console.log(`[Feedback System] Using custom SMTP server config: ${transportConfig.host}:${transportConfig.port} (secure: ${transportConfig.secure})`);
                    } else {
                        transportConfig.service = process.env.EMAIL_SERVICE || 'gmail';
                        console.log(`[Feedback System] Using standard email service config: ${transportConfig.service}`);
                    }

                    const transporter = (nodemailer.default || nodemailer).createTransport(transportConfig);

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
                        console.log(`[Feedback System] Dispatching notification email to admins: ${adminEmails.join(', ')}`);
                        const info = await transporter.sendMail(mailOptions);
                        console.log('[Feedback System] Email notification dispatched successfully. Info:', info.messageId || info);
                    } else {
                        console.log('[Feedback System] No admin email addresses found to send notifications.');
                    }
                } catch (emailErr) {
                    console.error('[Feedback System] Nodemailer error for admin feedback notification:', emailErr.message);
                }
            } else {
                console.warn('[Feedback System] Email notifications SKIPPED: EMAIL_USER and/or EMAIL_PASS environment variables are not defined in .env');
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

            console.log(`[Feedback System] Admin push tokens collected: ${allTokens.length}. Tokens:`, allTokens);

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

                console.log('[Feedback System] Sending push notifications to Expo service...');
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
                console.log('[Feedback System] Expo API Response:', JSON.stringify(resData));
            } else {
                console.log('[Feedback System] No registered push tokens found for administrators. Physical device registration is required.');
            }
        } catch (pushErr) {
            console.error('[Feedback System] Failed to notify admins of feedback:', pushErr.message);
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

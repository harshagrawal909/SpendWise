import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const createToken = (user) => jwt.sign(
    {
        id: user._id,
        email: user.email,
        name: user.name,
        provider: user.provider
    },
    process.env.JWT_SECRET,
    { expiresIn: '365d' }
);

const getGoogleClientIds = () => [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    ...(process.env.GOOGLE_CLIENT_IDS || '').split(',')
]
    .map((id) => id?.trim())
    .filter(Boolean);

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await User.create({
            name,
            email: String(email).toLowerCase(),
            password: hashedPassword,
            provider: 'local'
        });
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: String(email || '').toLowerCase() });

        if (user?.provider === 'google' && !user.password) {
            return res.status(400).json({ message: "Please sign in with Google." });
        }

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = createToken(user);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: "Google token is required" });
        }
        const googleClientIds = getGoogleClientIds();
        if (!googleClientIds.length) {
            return res.status(500).json({ message: "Google sign-in is not configured" });
        }

        const params = new URLSearchParams({ id_token: idToken });
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?${params}`);
        if (!googleRes.ok) {
            return res.status(401).json({ message: "Invalid Google token" });
        }

        const profile = await googleRes.json();
        if (!googleClientIds.includes(profile.aud)) {
            return res.status(401).json({ message: "Google token audience mismatch" });
        }
        if (profile.email_verified !== 'true') {
            return res.status(401).json({ message: "Google email is not verified" });
        }

        const email = String(profile.email || '').toLowerCase();
        let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] });

        if (!user) {
            user = await User.create({
                name: profile.name || email.split('@')[0],
                email,
                provider: 'google',
                googleId: profile.sub,
                photoUrl: profile.picture,
                emailVerified: true
            });
        } else {
            user.name = profile.name || user.name;
            user.email = email;
            user.provider = user.password ? user.provider : 'google';
            user.googleId = profile.sub;
            user.photoUrl = profile.picture || user.photoUrl;
            user.emailVerified = true;
            await user.save();
        }

        const token = createToken(user);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

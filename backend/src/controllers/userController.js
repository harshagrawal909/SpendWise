import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (user.provider === 'google' && !user.password) {
            return res.status(400).json({ message: "Google accounts do not use password changes" });
        }

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ message: "Current password incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();
        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            name: user.name,
            email: user.email,
            provider: user.provider,
            photoUrl: user.photoUrl,
            emailVerified: user.emailVerified,
            dateOfBirth: user.dateOfBirth,
            createdAt: user.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

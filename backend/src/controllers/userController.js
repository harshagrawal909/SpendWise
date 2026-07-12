import User from '../models/User.js';
import Expense from '../models/Expense.js';
import Account from '../models/Account.js';
import bcrypt from 'bcryptjs';
import { convertCurrency } from '../utils/currency.js';

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
            role: user.role,
            currency: user.currency || 'INR',
            createdAt: user.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, currency, dateOfBirth } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const oldCurrency = user.currency || 'INR';

        if (name) user.name = name;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;

        if (currency && currency !== oldCurrency) {
            user.currency = currency;
            // Recalculate convertedAmount for all existing user transactions
            const expenses = await Expense.find({ user: user._id });
            for (const exp of expenses) {
                const transCurrency = exp.currency || 'INR';
                exp.convertedAmount = await convertCurrency(exp.amount, transCurrency, currency);
                await exp.save();
            }
        }

        await user.save();
        res.json({
            message: "Profile updated successfully",
            user: {
                name: user.name,
                email: user.email,
                provider: user.provider,
                photoUrl: user.photoUrl,
                emailVerified: user.emailVerified,
                dateOfBirth: user.dateOfBirth,
                role: user.role,
                currency: user.currency || 'INR',
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        // Delete all expenses belonging to the user
        await Expense.deleteMany({ user: userId });
        // Delete all accounts belonging to the user
        await Account.deleteMany({ user: userId });
        // Delete the user
        await User.findByIdAndDelete(userId);
        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

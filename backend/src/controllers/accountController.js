import Account from '../models/Account.js';
import Expense from '../models/Expense.js';
import { updateAccountBalance } from '../utils/accountHelper.js';

// Get all accounts for user. Auto-create default account if none exists.
export const getAccounts = async (req, res) => {
    try {
        const userId = req.user.id;
        let accounts = await Account.find({ user: userId });

        if (accounts.length === 0) {
            // Seed a default account
            const defaultAccount = new Account({
                user: userId,
                name: 'Primary',
                isDefault: true,
                color: '#4F46E5' // Indigo
            });
            await defaultAccount.save();
            accounts = [defaultAccount];

            // Migration: link all existing user expenses to this new default account
            await Expense.updateMany(
                { user: userId, account: { $exists: false } },
                { account: defaultAccount._id }
            );
        }

        // Sort so the default/primary account is always first in the list
        accounts.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new account (max 3)
export const createAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, balance, isDefault, color } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: "Account name is required" });
        }

        // Check limit
        const count = await Account.countDocuments({ user: userId });
        if (count >= 3) {
            return res.status(400).json({ message: "You can have a maximum of 3 accounts." });
        }

        // Check if name already exists
        const exists = await Account.findOne({
            user: userId,
            name: { $regex: new RegExp("^" + name.trim() + "$", "i") }
        });
        if (exists) {
            return res.status(400).json({ message: "An account with this name already exists." });
        }

        // Handle default status
        if (isDefault) {
            await Account.updateMany({ user: userId }, { isDefault: false });
        }

        const newAccount = new Account({
            user: userId,
            name: name.trim(),
            balance: 0, // balance will be computed from the initial transaction if any
            isDefault: !!isDefault || count === 0, // Force default if it's the first account
            color: color || '#4F46E5'
        });

        await newAccount.save();

        const initialBal = Number(balance) || 0;
        if (initialBal > 0) {
            const initialExpense = new Expense({
                user: userId,
                account: newAccount._id,
                amount: initialBal,
                convertedAmount: initialBal,
                category: 'Starting Balance',
                description: `Starting Balance`,
                type: 'INCOME',
                date: new Date()
            });
            await initialExpense.save();
            await updateAccountBalance(newAccount._id);
        }

        // Refresh the account from database to return the calculated balance
        const refreshedAccount = await Account.findById(newAccount._id);
        res.status(201).json(refreshedAccount);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update an account
export const updateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;
        const { name, balance, isDefault, color } = req.body;

        const account = await Account.findOne({ _id: accountId, user: userId });
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        if (name && name.trim() !== account.name) {
            // Check if name is already taken
            const exists = await Account.findOne({
                user: userId,
                _id: { $ne: accountId },
                name: { $regex: new RegExp("^" + name.trim() + "$", "i") }
            });
            if (exists) {
                return res.status(400).json({ message: "An account with this name already exists." });
            }
            account.name = name.trim();
        }

        if (balance !== undefined) {
            account.balance = Number(balance) || 0;
        }

        if (color) {
            account.color = color;
        }

        if (isDefault !== undefined) {
            if (isDefault === false && account.isDefault) {
                return res.status(400).json({ message: "At least one account must be set as default." });
            }
            if (isDefault === true) {
                await Account.updateMany({ user: userId }, { isDefault: false });
                account.isDefault = true;
            }
        }

        await account.save();
        res.json(account);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete an account (cascade expenses to default account)
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;

        const account = await Account.findOne({ _id: accountId, user: userId });
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        if (account.isDefault) {
            return res.status(400).json({ message: "Cannot delete the default account. Set another account as default first." });
        }

        // Find the default account to reassign expenses
        const defaultAccount = await Account.findOne({ user: userId, isDefault: true });
        if (!defaultAccount) {
            return res.status(400).json({ message: "Default account not found. Please set a default account first." });
        }

        // Cascade expenses to default account
        await Expense.updateMany(
            { user: userId, account: accountId },
            { account: defaultAccount._id }
        );

        // Recalculate default account balance
        await updateAccountBalance(defaultAccount._id);

        // Delete the account
        await Account.deleteOne({ _id: accountId, user: userId });

        res.json({ message: "Account deleted and its transactions reassigned to default account successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

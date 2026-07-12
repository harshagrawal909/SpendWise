import Expense from '../models/Expense.js';
import User from '../models/User.js';
import Account from '../models/Account.js';
import { convertCurrency } from '../utils/currency.js';
import { updateAccountBalance } from '../utils/accountHelper.js';
import mongoose from "mongoose";

export const addExpense = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const userCurrency = user?.currency || 'INR';
        const transCurrency = req.body.currency || userCurrency;

        const convertedAmount = await convertCurrency(req.body.amount, transCurrency, userCurrency);

        let accountId = req.body.account;
        if (!accountId) {
            let defaultAccount = await Account.findOne({ user: req.user.id, isDefault: true });
            if (!defaultAccount) {
                defaultAccount = new Account({
                    user: req.user.id,
                    name: 'Primary',
                    isDefault: true,
                    color: '#4F46E5'
                });
                await defaultAccount.save();
            }
            accountId = defaultAccount._id;
        } else {
            const exists = await Account.findOne({ _id: accountId, user: req.user.id });
            if (!exists) {
                return res.status(400).json({ message: "Invalid account selected." });
            }
        }

        const newExpense = new Expense({ 
            ...req.body, 
            currency: transCurrency,
            convertedAmount,
            user: req.user.id,
            account: accountId
        });
        await newExpense.save();
        await updateAccountBalance(accountId);
        
        // Populate account info for frontend
        const populated = await Expense.findById(newExpense._id).populate('account');
        
        res.status(201).json(populated);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getSummary = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const { accountId } = req.query;

        const match = { user: userId };
        if (accountId) {
            match.account = new mongoose.Types.ObjectId(accountId);
        }

        const stats = await Expense.aggregate([
            { $match: match }, 
            { $group: { _id: "$type", total: { $sum: { $ifNull: [ "$convertedAmount", "$amount" ] } } } }
        ]);
        
        const summary = { income: 0, expense: 0 };
        stats.forEach(item => {
            if (item._id === "INCOME") summary.income = item.total;
            if (item._id === "EXPENSE") summary.expense = item.total;
        });
        
        res.json(summary);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getExpenses = async (req, res) => {
    try {
        const { accountId } = req.query;
        const query = { user: req.user.id };
        if (accountId) {
            query.account = accountId;
        }
        const expenses = await Expense.find(query).populate('account').sort({ date: -1 });
        res.json(expenses);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const updateExpense = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const userCurrency = user?.currency || 'INR';

        const existing = await Expense.findOne({ _id: req.params.id, user: req.user.id });
        if (!existing) {
            return res.status(404).json({ message: "Expense not found" });
        }

        const amount = req.body.amount !== undefined ? req.body.amount : existing.amount;
        const currency = req.body.currency !== undefined ? req.body.currency : (existing.currency || 'INR');

        const convertedAmount = await convertCurrency(amount, currency, userCurrency);

        if (req.body.account) {
            const exists = await Account.findOne({ _id: req.body.account, user: req.user.id });
            if (!exists) {
                return res.status(400).json({ message: "Invalid account selected." });
            }
        }

        const updated = await Expense.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { ...req.body, convertedAmount },
            { new: true }
        ).populate('account');

        await updateAccountBalance(existing.account);
        if (req.body.account && String(req.body.account) !== String(existing.account)) {
            await updateAccountBalance(req.body.account);
        }

        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const deleteExpense = async (req, res) => {
    try {
        const existing = await Expense.findOne({ _id: req.params.id, user: req.user.id });
        if (existing) {
            await Expense.deleteOne({ _id: req.params.id, user: req.user.id });
            await updateAccountBalance(existing.account);
        }
        res.json({ message: "Expense deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getMonthlyExpenses = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const { accountId } = req.query;
        const match = { user: userId, type: "EXPENSE" };
        if (accountId) {
            match.account = new mongoose.Types.ObjectId(accountId);
        }
        const data = await Expense.aggregate([
            { $match: match },
            { 
                $group: { 
                    _id: { $month: "$date" }, 
                    total: { $sum: { $ifNull: [ "$convertedAmount", "$amount" ] } } 
                } 
            },
            { $sort: { "_id": 1 } }
        ]);
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const filterExpenses = async (req, res) => {
    try {
        const { category, startDate, endDate, sort, accountId } = req.query;
        let query = { user: req.user.id };

        // 1. Filter by category
        if (category) query.category = category;

        // 2. Filter by account
        if (accountId) query.account = accountId;

        // 3. Filter by date range
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // 4. Query DB
        let expenses = Expense.find(query).populate('account');

        // 5. Sort
        if (sort === 'asc') expenses = expenses.sort({ date: 1 });
        else expenses = expenses.sort({ date: -1 });

        const result = await expenses;
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
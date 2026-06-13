import Expense from '../models/Expense.js';
import User from '../models/User.js';
import { convertCurrency } from '../utils/currency.js';
import mongoose from "mongoose";

export const addExpense = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const userCurrency = user?.currency || 'INR';
        const transCurrency = req.body.currency || userCurrency;

        const convertedAmount = await convertCurrency(req.body.amount, transCurrency, userCurrency);

        const newExpense = new Expense({ 
            ...req.body, 
            currency: transCurrency,
            convertedAmount,
            user: req.user.id 
        });
        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getSummary = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const stats = await Expense.aggregate([
            { $match: { user: userId } }, 
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
        const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
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

        const updated = await Expense.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { ...req.body, convertedAmount },
            { new: true }
        );
        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const deleteExpense = async (req, res) => {
    try {
        await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.json({ message: "Expense deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getMonthlyExpenses = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const data = await Expense.aggregate([
            { $match: { user: userId, type: "EXPENSE" } },
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
        const { category, startDate, endDate, sort } = req.query;
        let query = { user: req.user.id };

        // 1. Filter by category
        if (category) query.category = category;

        // 2. Filter by date range
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // 3. Query DB
        let expenses = Expense.find(query);

        // 4. Sort
        if (sort === 'asc') expenses = expenses.sort({ date: 1 });
        else expenses = expenses.sort({ date: -1 });

        const result = await expenses;
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
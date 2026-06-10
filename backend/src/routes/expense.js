import express from "express"
const router = express.Router();

import { 
    addExpense, getExpenses, updateExpense, deleteExpense, getSummary, getMonthlyExpenses, filterExpenses 
} from '../controllers/expenseController.js';

router.post('/', addExpense);
router.get('/summary', getSummary);
router.get('/', getExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.get('/monthly', getMonthlyExpenses);
router.get('/filter', filterExpenses);


export default router;
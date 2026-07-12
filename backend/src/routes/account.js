import express from 'express';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../controllers/accountController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getAccounts);
router.post('/', authMiddleware, createAccount);
router.put('/:id', authMiddleware, updateAccount);
router.delete('/:id', authMiddleware, deleteAccount);

export default router;

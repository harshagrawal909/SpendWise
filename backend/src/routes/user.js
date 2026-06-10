import express from 'express';
import { changePassword, getMe } from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Route: /api/users/me
router.get('/me', authMiddleware, getMe);

// Route: /api/users/change-password
router.put('/change-password', authMiddleware, changePassword);

export default router;

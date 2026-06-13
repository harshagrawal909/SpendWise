import express from 'express';
import { changePassword, getMe, deleteAccount, updateProfile } from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Route: /api/users/me
router.get('/me', authMiddleware, getMe);

// Route: /api/users/profile (PUT)
router.put('/profile', authMiddleware, updateProfile);

// Route: /api/users/change-password
router.put('/change-password', authMiddleware, changePassword);

// Route: /api/users/me (DELETE)
router.delete('/me', authMiddleware, deleteAccount);

export default router;

import express from 'express';
import Stats from '../models/Stats.js';

const router = express.Router();

// GET /api/download/apk — Increment download counter and redirect to APK
router.get('/apk', async (req, res) => {
    try {
        await Stats.increment('apk_downloads');
        // Redirect to the static APK file served by the frontend on Vercel
        const frontendUrl = process.env.FRONTEND_URL || 'https://myspendwise-finance.vercel.app';
        res.redirect(`${frontendUrl}/SpendWise.apk`);
    } catch (err) {
        // Even if counter fails, still serve the download
        console.error('Download counter error:', err.message);
        const frontendUrl = process.env.FRONTEND_URL || 'https://myspendwise-finance.vercel.app';
        res.redirect(`${frontendUrl}/SpendWise.apk`);
    }
});

export default router;

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import mongoose from 'mongoose';
import User from '../models/User.js';

const ADMIN_EMAIL = 'harshagrawal4256@gmail.com';

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        let user = await User.findOne({ email: ADMIN_EMAIL });

        if (!user) {
            user = await User.create({
                name: 'Harsh Agrawal',
                email: ADMIN_EMAIL,
                provider: 'google',
                role: 'admin',
                emailVerified: true,
            });
            console.log(`Created new admin user "${ADMIN_EMAIL}".`);
        } else if (user.role === 'admin') {
            console.log(`"${ADMIN_EMAIL}" is already an admin.`);
        } else {
            user.role = 'admin';
            await user.save();
            console.log(`Successfully promoted "${ADMIN_EMAIL}" to admin!`);
        }

        console.log('User details:', {
            name: user.name,
            email: user.email,
            role: user.role,
            provider: user.provider,
            createdAt: user.createdAt,
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

seedAdmin();

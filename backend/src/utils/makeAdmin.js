import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from '../models/User.js';

const EMAIL_TO_PROMOTE = 'harshagrawal4256@gmail.com';

async function makeAdmin() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not set in env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: EMAIL_TO_PROMOTE });
        if (!user) {
            console.error(`User with email "${EMAIL_TO_PROMOTE}" not found!`);
            await mongoose.disconnect();
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();
        console.log(`Successfully promoted "${EMAIL_TO_PROMOTE}" to admin!`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

makeAdmin();

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from '../models/User.js';

const ADMIN_EMAILS = ['harshagrawal4256@gmail.com', 'harshagrawal909@gmail.com'];

async function seedAdmins() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not set in env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        for (const email of ADMIN_EMAILS) {
            let user = await User.findOne({ email });

            if (!user) {
                user = await User.create({
                    name: email.split('@')[0],
                    email,
                    provider: 'google',
                    role: 'admin',
                    emailVerified: true,
                });
                console.log(`Created new admin user "${email}".`);
            } else if (user.role === 'admin') {
                console.log(`"${email}" is already an admin.`);
            } else {
                user.role = 'admin';
                await user.save();
                console.log(`Successfully promoted "${email}" to admin!`);
            }

            console.log('User details:', {
                name: user.name,
                email: user.email,
                role: user.role,
                provider: user.provider,
            });
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

seedAdmins();

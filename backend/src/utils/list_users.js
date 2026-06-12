import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from '../models/User.js';

async function listUsers() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not set in env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'name email role provider lastSeenAt');
        console.log('--- USERS IN DATABASE ---');
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}): role=${u.role}, provider=${u.provider}, lastSeen=${u.lastSeenAt}`);
        });
        console.log('-------------------------');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

listUsers();

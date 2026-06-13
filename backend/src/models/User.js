import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String },
    photoUrl: { type: String },
    emailVerified: { type: Boolean, default: false },
    dateOfBirth: { type: Date },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    currency: { type: String, default: 'INR' },
    pushTokens: [{ type: String }],
    lastSeenAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('User', userSchema);

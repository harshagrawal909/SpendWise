import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    color: {
        type: String,
        default: '#4F46E5' // Indigo
    }
}, { timestamps: true });

// Ensure compound uniqueness of account name per user
accountSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model('Account', accountSchema);

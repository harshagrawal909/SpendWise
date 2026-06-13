import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    type: {
        type: String,
        enum: ['bug', 'feature', 'other'],
        default: 'other'
    },
    message: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        enum: ['web', 'mobile'],
        required: true
    },
    status: {
        type: String,
        enum: ['unread', 'resolved', 'archived'],
        default: 'unread'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;

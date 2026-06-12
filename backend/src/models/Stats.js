import mongoose from 'mongoose';

const statsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Number, default: 0 }
});

// Helper to atomically increment a stat
statsSchema.statics.increment = async function (key, amount = 1) {
    return this.findOneAndUpdate(
        { key },
        { $inc: { value: amount } },
        { upsert: true, returnDocument: 'after' }
    );
};

// Helper to get a stat value
statsSchema.statics.getValue = async function (key) {
    const doc = await this.findOne({ key });
    return doc ? doc.value : 0;
};

export default mongoose.model('Stats', statsSchema);

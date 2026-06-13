import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    description: String,
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE'],
      required: true
    },
    currency: { type: String, default: 'INR' },
    convertedAmount: { type: Number },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

export default mongoose.model('Expense', expenseSchema);
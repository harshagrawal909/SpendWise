import 'dotenv/config'; // Loads environment variables
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

// Route imports
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expense.js';
import authMiddleware from './middleware/auth.js';
import userRoutes from "./routes/user.js"

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', authMiddleware, expenseRoutes);
app.use('/api/users', userRoutes)

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch(err => console.log(err));
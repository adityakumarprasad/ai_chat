import morgan from 'morgan';
import express from 'express';
import userRoutes from './routes/user.routes.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app;
import morgan from 'morgan';
import express from 'express';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.route.js';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';

import cookieParser from 'cookie-parser';
import redisClient from './services/redis.service.js';
const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Adjust this to your frontend's origin
  credentials: true // Allow cookies to be sent
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app;
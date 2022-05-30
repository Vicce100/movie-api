import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import videRoutes from './src/routes/video.js';
import userRoutes from './src/routes/user.js';
import corsOptions from './src/config/corsOptions.js';
dotenv.config();
const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors(corsOptions));
app.use('/video', videRoutes);
app.use('/user', userRoutes);
// connect to db
const dbConnectionString = process.env.DB_connectionLocal || 'mongodb://localhost/MovieDB';
mongoose
    .connect(dbConnectionString)
    .then(() => console.log('Connected to DB...'))
    .catch((err) => console.log(err));
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`it's alive on http://localhost:${port}`));

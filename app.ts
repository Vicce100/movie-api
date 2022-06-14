import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';

import videRoutes from './src/routes/video.js';
import userRoutes from './src/routes/user.js';
import indexRouter from './src/routes/index.js';
import corsOptions from './src/config/corsOptions.js';

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));

app.use('/uploads', express.static('uploads/images/public'));
app.use('/video', videRoutes);
app.use('/user', userRoutes);
app.use(indexRouter);

// connect to db
const dbConnectionString =
  process.env.DB_connectionLocal || 'mongodb://localhost/MovieDB';
mongoose
  .connect(dbConnectionString)
  .then(() => console.log('Connected to DB...'))
  .catch((err) => console.log(err));

const uploads = './uploads';
const images = `${uploads}/images`;

const imageCheck = () => {
  fs.mkdirSync(images);
  fs.mkdirSync(`${images}/private`);
  fs.mkdirSync(`${images}/public`);
};

const checkAssetsFolder = () => {
  if (!fs.existsSync(uploads)) {
    fs.mkdirSync(uploads);
    fs.mkdirSync(`${uploads}/videos`);
    return imageCheck();
  }
  if (!fs.existsSync(`${uploads}/videos`)) fs.mkdirSync(`${uploads}/videos`);
  if (!fs.existsSync(images)) return imageCheck();
  if (!fs.existsSync(`${images}/private`)) fs.mkdirSync(`${images}/private`);
  if (!fs.existsSync(`${images}/public`)) fs.mkdirSync(`${images}/public`);
};
checkAssetsFolder();

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`it's alive on http://localhost:${port}`));

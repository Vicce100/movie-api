import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';

import userRoutes from './src/routes/user.js';
import indexRouter from './src/routes/index.js';
import corsOptions from './src/config/corsOptions.js';

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));

app.use('/uploads/images/public/', express.static('uploads/images/public'));
app.use('/uploads/videos/public/', express.static('uploads/videos/public'));
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
const videos = `${uploads}/videos`;

const imageCheck = () => {
  fs.mkdirSync(images);
  fs.mkdirSync(`${images}/private`);
  fs.mkdirSync(`${images}/public`);
};
const videoCheck = () => {
  fs.mkdirSync(videos);
  fs.mkdirSync(`${videos}/private`);
  fs.mkdirSync(`${videos}/public`);
};

// setup folder structure for image and video files
const checkAssetsFolder = () => {
  if (!fs.existsSync(uploads)) {
    fs.mkdirSync(uploads);
    videoCheck();
    return imageCheck();
  }
  if (!fs.existsSync(videos)) videoCheck();
  if (!fs.existsSync(`${videos}/private`)) fs.mkdirSync(`${videos}/private`);
  if (!fs.existsSync(`${videos}/public`)) fs.mkdirSync(`${videos}/public`);
  if (!fs.existsSync(images)) imageCheck();
  if (!fs.existsSync(`${images}/private`)) fs.mkdirSync(`${images}/private`);
  if (!fs.existsSync(`${images}/public`)) fs.mkdirSync(`${images}/public`);
};
checkAssetsFolder();

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`it's alive on http://localhost:${port}`));

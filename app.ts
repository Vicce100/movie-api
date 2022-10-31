// https://stackoverflow.com/questions/15809611/bcrypt-invalid-elf-header-when-running-node-app
// to get bcrypt to work on windows just install it like "npm i bcrypt"
// to get bcrypt to work on linux you need to run the
// following command as root "npm i bcrypt --unsafe-perm=true --allow-root --save"

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';

import { resetMonthlyViews } from './src/utilities/cron.js';

import userRoutes from './src/routes/user.js';
import videoRoutes from './src/routes/video.js';
import indexRouter from './src/routes/index.js';
import corsOptions from './src/config/corsOptions.js';

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));

app.use('/uploads/images/public/', express.static('uploads/images/public'));
app.use('/uploads/images/ffmpeg/', express.static('uploads/images/ffmpeg'));
app.use('/user', userRoutes);
app.use('/video', videoRoutes);
app.use(indexRouter);

const dbConnectionString =
  process.env.DB_connectionLocal || 'mongodb://localhost/MovieDB';
mongoose
  .connect(dbConnectionString)
  .then(() => console.log('Connected to DB...'))
  .catch((err) => console.log(err));

resetMonthlyViews();

const uploads = './uploads';
const [images, videos] = [`${uploads}/images`, `${uploads}/videos`];

const imageCheck = () => {
  fs.mkdirSync(images);
  fs.mkdirSync(`${images}/private`);
  fs.mkdirSync(`${images}/public`);
  fs.mkdirSync(`${images}/ffmpeg`);
};
const videoCheck = () => {
  fs.mkdirSync(videos);
  fs.mkdirSync(`${videos}/public`);
  fs.mkdirSync(`${videos}/converted`);
};

// setup folder structure for image and video files
(() => {
  if (!fs.existsSync(uploads)) {
    fs.mkdirSync(uploads);
    videoCheck();
    return imageCheck();
  }
  if (!fs.existsSync(videos)) videoCheck();
  if (!fs.existsSync(`${videos}/public`)) fs.mkdirSync(`${videos}/public`);
  if (!fs.existsSync(`${videos}/converted`))
    fs.mkdirSync(`${videos}/converted`);
  if (!fs.existsSync(images)) imageCheck();
  if (!fs.existsSync(`${images}/private`)) fs.mkdirSync(`${images}/private`);
  if (!fs.existsSync(`${images}/public`)) fs.mkdirSync(`${images}/public`);
  if (!fs.existsSync(`${images}/ffmpeg`)) fs.mkdirSync(`${images}/ffmpeg`);
})();

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`it's alive on http://localhost:${port}`));

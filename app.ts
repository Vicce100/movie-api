/*
https://stackoverflow.com/questions/15809611/bcrypt-invalid-elf-header-when-running-node-app
to get bcrypt to work on windows just install it like "npm i bcrypt"
to get bcrypt to work on linux (tested on ubuntu 20.04) you need to run the
following command as root "npm i bcrypt --unsafe-perm=true --allow-root --save"
*/

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path);

import { resetMonthlyViews } from './src/utilities/cron.js';

import userRoutes from './src/routes/user.js';
import videoRoutes from './src/routes/video.js';
import indexRouter from './src/routes/index.js';
import corsOptions from './src/config/corsOptions.js';
import bodyParser from 'body-parser';

export const [protocol, port, ip, url] = [
  process.env.NODE_ENV === 'production' ? 'http' : 'http',
  process.env.PORT || '17053', // should always use '17053' as the standard port
  process.env.NODE_ENV === 'production'
    ? process.env.IP_ADDR
    : process.env.IP_LOCAL,
  `http://${
    process.env.NODE_ENV === 'production' ? process.env.IP_ADDR : 'localhost'
  }:${process.env.PORT || 17053}`,
];

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '500mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));

app.use('/uploads/images/public/', express.static('uploads/images/public'));
app.use('/uploads/images/ffmpeg/', express.static('uploads/images/ffmpeg'));
app.use('/user', userRoutes);
app.use('/video', videoRoutes);
app.use(indexRouter);

const DataBaseString =
  process.env.NODE_ENV === 'production' && process.env.DB_PRODUCTION
    ? process.env.DB_PRODUCTION
    : process.env.NODE_ENV === 'develop' && process.env.DB_LOCAL
    ? process.env.DB_LOCAL
    : 'mongodb://localhost/MovieDB';

mongoose
  .connect(DataBaseString)
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

app.listen(port, () => console.log(`It's alive on ${url}`));

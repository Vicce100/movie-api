import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import multer from 'multer';
import {
  authenticateToken,
  fileFilterVideos as fileFilter,
} from '../utilities/middleware.js';
import { mp4 } from '../utilities/types.js';

dotenv.config();

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => cb(null, Date.now() + file.originalname),
});

const upload = multer({ storage, fileFilter });

router.get('/', authenticateToken, (req, res) => {
  const { range } = req.headers;
  if (!range) return res.status(404).send('Missing Requires Range header! ');

  const videoPath = 'uploads/videos/Blue.mp4';
  const videoSize = fs.statSync(videoPath).size;
  // const chunkSize = 1 * 1e6; // 1MB

  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': end - start + 1, // contentLength
    'Content-Type': mp4,
  });

  const stream = fs.createReadStream(videoPath, { start, end });
  stream.pipe(res);
  stream.on('connection', (connect) => {
    connect.on('close', (close: any) => {
      console.log(close);
    });
  });
});

router.post('/upload/single', upload.single('videoFile'), (req, res) => {
  const { file } = req;
  if (!file) return res.status(404).send('No file or wrong file was uploaded!');
  console.log(file);
  // update video collection with new video

  // status 201 created
  res.status(201).redirect('http://localhost:3000/PostFile');
});

export default router;

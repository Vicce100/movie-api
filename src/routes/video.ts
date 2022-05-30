import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import { authenticateToken } from '../utilities/middleware.js';

dotenv.config();

const router = express.Router();

router.get('/getVideo', authenticateToken, (req, res) => {
  const { range } = req.headers;
  if (!range) return res.status(404).send('Missing Requiers Range header! ');

  const videoPath = './Blue.mp4';
  const videoSize = fs.statSync(videoPath).size;
  // const chunkSize = 1 * 1e6;

  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  const contentLength = end - start + 1;
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
  };

  res.writeHead(206, headers);

  const stream = fs.createReadStream(videoPath, { start, end });
  stream.pipe(res);
});

export default router;

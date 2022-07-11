import express from 'express';
import {
  isAuthenticate,
  multerErrorHandler,
  fileFilterAll as fileFilter,
} from '../utilities/middleware.js';
import multer from 'multer';
import {
  getVideo,
  getSingleVideoData,
  getVideosData,
  getVideosDataByCategory,
  postSingleVideo,
  deleteVideo,
  generateFFmpegToVideo,
} from '../controller/video.js';
import { cleanString } from '../utilities/index.js';

const router = express.Router();

router.use(isAuthenticate);

const publicVideoStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];
    if (fileType === 'video') return cb(null, 'uploads/videos/public/');
    else if (fileType === 'image') return cb(null, 'uploads/images/public/');
  },
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${cleanString(file.originalname)}`),
});

const privateVideoStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];
    if (fileType === 'video') return cb(null, 'uploads/videos/private/');
    else if (fileType === 'image') return cb(null, 'uploads/images/private/');
  },
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${cleanString(file.originalname)}`),
});

const publicVideoUpload = multer({ storage: publicVideoStorage, fileFilter });
const privateVideoUpload = multer({ storage: privateVideoStorage, fileFilter });

router.get('/:videoId', getVideo);

router.get('/data/:videoId', getSingleVideoData);

router.get('/data/', getVideosData);

router.get('/data/category/:categoryName', getVideosDataByCategory);

router.delete('/delete/:videoId', deleteVideo);

router.post(
  '/upload/singe/public',
  publicVideoUpload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'displayPicture', maxCount: 1 },
  ]),
  multerErrorHandler,
  postSingleVideo
);

router.post(
  '/upload/singe/private',
  privateVideoUpload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'displayPicture', maxCount: 1 },
  ]),
  multerErrorHandler,
  postSingleVideo
);

router.get('/ffmpeg/:videoId', generateFFmpegToVideo);

export default router;

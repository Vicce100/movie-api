import express from 'express';
import {
  isAuthenticate,
  multerErrorHandler,
  fileFilterAll as fileFilter,
} from '../utilities/middleware.js';
import multer from 'multer';
import {
  addMultipleAvatars,
  addMultipleCategories,
  addSingleAvatar,
  addSingleCategory,
  sendMultipleCategories,
  sendSingleCategory,
  sendSingleAvatar,
  sendMultipleAvatars,
  getVideo,
  getSingleVideoData,
  getVideosData,
  getVideosDataByCategory,
  postSingleVideo,
  deleteVideo,
  checkAuthFunction,
  checkAuthRole,
  generateFFmpegToVideo,
} from '../controller/index.js';
import { cleanString } from '../utilities/index.js';

const router = express.Router();

// router.use(isAuthenticate);

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/images/public/'),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${cleanString(file.originalname)}`),
});
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

const uploadPublicImage = multer({ fileFilter, storage: imageStorage });
const publicVideoUpload = multer({ storage: publicVideoStorage, fileFilter });
const privateVideoUpload = multer({ storage: privateVideoStorage, fileFilter });

router.post('/category/upload/single', addSingleCategory);

router.post('/category/upload/multiple', addMultipleCategories);

router.get('/category/:categoryId', sendSingleCategory);

router.get('/category/get/multiple', sendMultipleCategories);

router.post(
  '/avatar/upload/single',
  uploadPublicImage.single('avatarImage'),
  multerErrorHandler,
  addSingleAvatar
);

router.post(
  '/avatar/upload/multiple',
  uploadPublicImage.array('avatarImage'),
  multerErrorHandler,
  addMultipleAvatars
);

router.get('/avatar/:avatarId', sendSingleAvatar);

router.get('/avatar/get/multiple', sendMultipleAvatars);

router.get('/video/:videoId', getVideo);

router.get('/video/data/:videoId', getSingleVideoData);

router.get('/video/data/', getVideosData);

router.get('/video/data/category/:categoryName', getVideosDataByCategory);

router.delete('/video/delete/:videoId', deleteVideo);

router.post(
  '/video/upload/singe/public',
  publicVideoUpload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'displayPicture', maxCount: 1 },
  ]),
  multerErrorHandler,
  postSingleVideo
);

router.post(
  '/video/upload/singe/private',
  privateVideoUpload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'displayPicture', maxCount: 1 },
  ]),
  multerErrorHandler,
  postSingleVideo
);

router.get('/video/ffmpeg/:videoId', generateFFmpegToVideo);

router.get('/user/checkAuth', checkAuthFunction);

// rolesType = 'user' | 'moderator' | 'admin' | 'superAdmin'
router.get('/user/checkAuth/:roleType', checkAuthRole);

export default router;

import express from 'express';
import {
  isAuthenticate,
  multerErrorHandler,
  fileFilterImages as fileFilter,
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
  postSingleVideo,
} from '../controller/index.js';

const router = express.Router();

router.use(isAuthenticate);

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/images/public/'),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replaceAll(' ', '-')}`),
});
const publicVideoStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // if (file.mimetype.split('/')[0] === 'video')
    return cb(null, 'uploads/videos/public/');
    // else if (file.mimetype.split('/')[0] === 'image')
    //   return cb(null, 'uploads/image/public/');
  },
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replaceAll(' ', '')}`),
});

const uploadPublicImage = multer({ fileFilter, storage: imageStorage });
const publicVideoUpload = multer({ storage: publicVideoStorage, fileFilter });

const uploadSingleVideo = publicVideoUpload.fields([
  // { name: 'title', maxCount: 1 }, // text
  { name: 'videoFile', maxCount: 1 },
  { name: 'displayPicture', maxCount: 1 },
  { name: 'album', maxCount: 100 },
  // { name: 'categories', maxCount: 20 }, // text
  // { name: 'description', maxCount: 1 }, // text
  // { name: 'releaseDate', maxCount: 1 }, // text
]);

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

router.get('/video/get', getVideo);

router.post('/video/upload/singe/public', uploadSingleVideo, postSingleVideo);

export default router;

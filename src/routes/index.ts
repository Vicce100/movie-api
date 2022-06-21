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
} from '../controller/index.js';

const router = express.Router();

router.use(isAuthenticate);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/images/public/'),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replaceAll(' ', '-')}`),
});

const upload = multer({ fileFilter, storage });

router.post('/category/upload/single', addSingleCategory);

router.post('/category/upload/multiple', addMultipleCategories);

router.get('/category/:categoryId', sendSingleCategory);

router.get('/category/get/multiple', sendMultipleCategories);

router.post(
  '/avatar/upload/single',
  upload.single('avatarImage'),
  multerErrorHandler,
  addSingleAvatar
);

router.post(
  '/avatar/upload/multiple',
  upload.array('avatarImage'),
  multerErrorHandler,
  addMultipleAvatars
);

router.get('/avatar/:avatarId', sendSingleAvatar);

router.get('/avatar/get/multiple', sendMultipleAvatars);

export default router;

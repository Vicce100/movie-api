import express from 'express';
import {
  authenticateToken,
  multerErrorHandler,
  fileFilterImages as fileFilter,
} from '../utilities/middleware.js';
import multer from 'multer';
import {
  addMultipleAvatars,
  addMultipleCategories,
  addSingleAvatar,
  addSingleCategory,
} from '../controller/index.js';

const router = express.Router();

// router.use(authenticateToken);
router.use(multerErrorHandler);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/images/public/'),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ fileFilter, storage });

router.post(
  '/category/upload/single',
  upload.single('categoryImage'),
  addSingleCategory
);

router.post(
  '/category/upload/multiple',
  upload.array('categoryImage'),
  addMultipleCategories
);

router.post(
  '/avatar/upload/single',
  upload.single('avatarImage'),
  addSingleAvatar
);

router.post(
  '/avatar/upload/multiple',
  upload.array('avatarImage'),
  addMultipleAvatars
);

export default router;

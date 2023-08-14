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
  addSingleFranchise,
  addMultipleFranchises,
  sendSingleFranchise,
  sendMultipleFranchise,
  sendSingleCategory,
  sendSingleAvatar,
  sendMultipleAvatars,
} from '../controller/index.js';
import { cleanString, routesString as rs } from '../utilities/index.js';
import { fix } from '../controller/video.js';

const router = express.Router();

// router.use(isAuthenticate);

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/images/public/'),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${cleanString(file.originalname)}`),
});

const uploadPublicImage = multer({ fileFilter, storage: imageStorage });

// `/${routesString.checkAuth}`

router.post(
  `/${rs.category}/${rs.upload}/${rs.single}`,
  addSingleCategory,
  isAuthenticate
);

router.post(
  `/${rs.category}/${rs.upload}/${rs.multiple}`,
  addMultipleCategories,
  isAuthenticate
);

router.get(
  `/${rs.category}/:${rs.categoryId}`,
  sendSingleCategory,
  isAuthenticate
);

router.get(
  `/${rs.category}/${rs.get}/${rs.multiple}`,
  sendMultipleCategories,
  isAuthenticate
);

router.post(
  `/${rs.franchise}/${rs.upload}/${rs.single}`,
  addSingleFranchise,
  isAuthenticate
);

router.post(
  `/${rs.franchise}/${rs.upload}/${rs.multiple}`,
  addMultipleFranchises,
  isAuthenticate
);

router.get(
  `/${rs.franchise}/:${rs.franchiseId}`,
  sendSingleFranchise,
  isAuthenticate
);

router.get(
  `/${rs.franchise}/${rs.get}/${rs.multiple}`,
  sendMultipleFranchise,
  isAuthenticate
);

router.post(
  `/${rs.avatar}/${rs.upload}/${rs.single}`,
  uploadPublicImage.single('avatarImage'),
  multerErrorHandler,
  addSingleAvatar,
  isAuthenticate
);

router.post(
  `/${rs.avatar}/${rs.upload}/${rs.multiple}`,
  uploadPublicImage.array('avatarImage'),
  multerErrorHandler,
  addMultipleAvatars,
  isAuthenticate
);

router.get(`/${rs.avatar}/:${rs.avatarId}`, sendSingleAvatar, isAuthenticate);

router.get(
  `/${rs.avatar}/${rs.get}/${rs.multiple}`,
  sendMultipleAvatars,
  isAuthenticate
);

// genera purpose for fixing things
router.get(`/fix`, fix);

export default router;

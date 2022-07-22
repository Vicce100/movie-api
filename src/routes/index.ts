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

const router = express.Router();

router.use(isAuthenticate);

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/images/public/'),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${cleanString(file.originalname)}`),
});

const uploadPublicImage = multer({ fileFilter, storage: imageStorage });

// `/${routesString.checkAuth}`

router.post(`/${rs.category}/${rs.upload}/${rs.single}`, addSingleCategory);

router.post(
  `/${rs.category}/${rs.upload}/${rs.multiple}`,
  addMultipleCategories
);

router.get(`/${rs.category}/:${rs.categoryId}`, sendSingleCategory);

router.get(`/${rs.category}/${rs.get}/${rs.multiple}`, sendMultipleCategories);

router.post(`/${rs.franchise}/${rs.upload}/${rs.single}`, addSingleFranchise);

router.post(
  `/${rs.franchise}/${rs.upload}/${rs.multiple}`,
  addMultipleFranchises
);

router.get(`/${rs.franchise}/:${rs.categoryId}`, sendSingleFranchise);

router.get(`/${rs.franchise}/${rs.get}/${rs.multiple}`, sendMultipleFranchise);

router.post(
  `/${rs.avatar}/${rs.upload}/${rs.single}`,
  uploadPublicImage.single('avatarImage'),
  multerErrorHandler,
  addSingleAvatar
);

router.post(
  `/${rs.avatar}/${rs.upload}/${rs.multiple}`,
  uploadPublicImage.array('avatarImage'),
  multerErrorHandler,
  addMultipleAvatars
);

router.get(`/${rs.avatar}/:${rs.avatarId}`, sendSingleAvatar);

router.get(`/${rs.avatar}/${rs.get}/${rs.multiple}`, sendMultipleAvatars);

export default router;

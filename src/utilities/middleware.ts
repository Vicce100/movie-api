import { NextFunction, Request, Response } from 'express';
import multer, { FileFilterCallback, MulterError } from 'multer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { jpeg, jpg, mp4, png } from './types.js';
import { MulterErrorCode } from './types.js';
import api from './api/index.js';

dotenv.config();

export const authenticateToken = (
  req: any,
  res: Response<any, Record<string, any>>,
  next: NextFunction
) => {
  const { cookies } = req;
  if (!cookies?.SSID)
    return res.status(401).json({ message: 'No token where send!' });

  if (process.env.SECRET_ACCESS_TOKEN) {
    try {
      jwt.verify(
        cookies?.SSID,
        process.env.SECRET_ACCESS_TOKEN,
        (err: unknown, user: unknown) => {
          if (err)
            return res
              .status(403)
              .json({ message: 'Cannot access this with the token you sent' });
          req.user = user;
          next();
        }
      );
    } catch (error) {
      return res.status(403).json({ error });
    }
  }
};

export const fileFilterAll = (
  __req: any,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === jpg || jpeg || png || mp4) return cb(null, true);
  cb(new MulterError(MulterErrorCode.LIMIT_UNEXPECTED_FILE));
};

export const fileFilterVideos = (
  __req: any,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === mp4) return cb(null, true);
  cb(new MulterError(MulterErrorCode.LIMIT_UNEXPECTED_FILE));
};

export const fileFilterImages = (
  __req: any,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.split('/')[0] === 'image') cb(null, true);
  if (file.mimetype === jpg || jpeg || png) return cb(null, true);
  cb(new MulterError(MulterErrorCode.LIMIT_UNEXPECTED_FILE));
};

export const multerErrorHandler = (
  error: multer.MulterError,
  _req: Request<{}, any, any, any, Record<string, any>>,
  res: Response<any, Record<string, any>>,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case MulterErrorCode.LIMIT_PART_COUNT:
        return res.status(400).json(api.returnErrorData('Too many files', 400));
      case MulterErrorCode.LIMIT_UNEXPECTED_FILE:
        return res
          .status(400)
          .json(api.returnErrorData('Unexpected file', 400));
      case MulterErrorCode.LIMIT_FILE_COUNT:
        return res.status(400).json(api.returnErrorData('Too many files', 400));
      case MulterErrorCode.LIMIT_FIELD_KEY:
        return res.status(400).json(api.returnErrorData('Too many files', 400));
      case MulterErrorCode.LIMIT_FIELD_VALUE:
        return res.status(400).json(api.returnErrorData('Too many files', 400));
      case MulterErrorCode.LIMIT_FIELD_COUNT:
        return res.status(400).json(api.returnErrorData('Too many files', 400));
      case MulterErrorCode.LIMIT_FILE_SIZE:
        return res.status(400).json(api.returnErrorData('File too large', 400));
    }
  }
  next();
};

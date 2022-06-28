import { NextFunction, Request, Response } from 'express';
import multer, { FileFilterCallback, MulterError } from 'multer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { MulterErrorCode, userRoles, UserType, errorCode } from './types.js';
import { assertNonNullish } from './assertions.js';
import db from './db/index.js';

dotenv.config();

const checkAuth = (cookies: any) => {
  if (!cookies?.SSID) throw new Error(errorCode.NOT_AUTHENTICATED);

  if (process.env.SECRET_ACCESS_TOKEN) {
    try {
      let tempUser: unknown = null;
      jwt.verify(
        cookies?.SSID,
        process.env.SECRET_ACCESS_TOKEN,
        (err: unknown, user: any) => {
          if (err) throw new Error(errorCode.ACCESS_WRONG_USER);
          tempUser = user;
        }
      );
      return tempUser as UserType;
    } catch (error: any) {
      throw new Error(error.message);
    }
  } else throw new Error(errorCode.MISSING_ENV_TOKEN);
};

export const errorHandler = (error: Error) => {
  switch (error.message) {
    case errorCode.NOT_AUTHENTICATED:
      return db.returnErrorData(errorCode.NOT_AUTHENTICATED, 401);
    case errorCode.ACCESS_WRONG_USER:
      return db.returnErrorData(errorCode.ACCESS_WRONG_USER, 401);
    case errorCode.MISSING_ENV_TOKEN:
      return db.returnErrorData(errorCode.MISSING_ENV_TOKEN, 500);
    case errorCode.VALUE_TAKEN:
      return db.returnErrorData(errorCode.VALUE_TAKEN, 400);
    case errorCode.VALUE_MISSING:
      return db.returnErrorData(errorCode.VALUE_MISSING, 404);
    default:
      return db.returnErrorData(
        error.message || errorCode.PERMISSION_DENIED,
        400
      );
  }
};

export const isAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = checkAuth(req.cookies);
    assertNonNullish(user, errorCode.NOT_AUTHENTICATED);

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const isModerator = (req: any, res: Response, next: NextFunction) => {
  try {
    const user = checkAuth(req.cookies);
    assertNonNullish(user, errorCode.NOT_AUTHENTICATED);

    if (user.role !== userRoles.moderator)
      return res.status(403).json({ message: 'You are not an moderator' });

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  try {
    const user = checkAuth(req.cookies);
    assertNonNullish(user, errorCode.NOT_AUTHENTICATED);

    if (user.role !== userRoles.admin)
      return res.status(403).json({ message: 'You are not an admin' });

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const isSuperAdmin = (
  req: any,
  res: Response<any, Record<string, any>>,
  next: NextFunction
) => {
  try {
    const user = checkAuth(req.cookies);
    assertNonNullish(user, errorCode.NOT_AUTHENTICATED);

    if (user.role !== userRoles.superAdmin)
      return res.status(403).json({ message: 'You are not an super admin' });

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const fileFilterAll = (
  __req: any,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.split('/')[0] === 'image' || 'video') return cb(null, true);
  cb(new MulterError(MulterErrorCode.LIMIT_UNEXPECTED_FILE));
};

export const fileFilterVideos = (
  __req: any,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.split('/')[0] === 'video') return cb(null, true);
  cb(new MulterError(MulterErrorCode.LIMIT_UNEXPECTED_FILE));
};

export const fileFilterImages = (
  __req: any,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.split('/')[0] === 'image') return cb(null, true);
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
        return res.status(400).json(db.returnErrorData('Too many files', 400));
      case MulterErrorCode.LIMIT_UNEXPECTED_FILE:
        return res.status(400).json(db.returnErrorData('Unexpected file', 400));
      case MulterErrorCode.LIMIT_FILE_COUNT:
        return res.status(400).json(db.returnErrorData('Too many files', 400));
      case MulterErrorCode.LIMIT_FIELD_KEY:
        return res.status(400).json(db.returnErrorData('Too many files', 400));
      case MulterErrorCode.LIMIT_FIELD_VALUE:
        return res.status(400).json(db.returnErrorData('Too many files', 400));
      case MulterErrorCode.LIMIT_FIELD_COUNT:
        return res.status(400).json(db.returnErrorData('Too many files', 400));
      case MulterErrorCode.LIMIT_FILE_SIZE:
        return res.status(400).json(db.returnErrorData('File too large', 400));
    }
  }
  next();
};

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import User from '../schemas/UserSchema.js';
import { generateAccessToken } from '../utilities/index.js';
// import { AuthRequestType, UserType } from '../utilities/types.js';
import db from '../utilities/db/index.js';

dotenv.config();

export const signUp = async (
  req: Request,
  res: Response<any, Record<string, any>>,
  next: NextFunction
) => {
  const {
    firstName,
    lastName,
    email,
    password,
  }: { firstName: string; lastName: string; email: string; password: string } =
    req.body;

  if (!password || !firstName || !lastName || !email)
    return res
      .status(400)
      .json(db.returnErrorData('no empty data in field', 400));
  if (await User.findOne({ email }))
    return res
      .status(400)
      .json(db.returnErrorData('username already taken', 404));

  try {
    await new User({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 10),
    }).save();
    next();
  } catch (error: any) {
    return res
      .status(500)
      .json(db.returnErrorData('server error while creating user', 500));
  }
};

export const login = async (
  req: Request<{}, any, any, any, Record<string, any>>,
  res: Response<any, Record<string, any>>
) => {
  if (!process.env.SECRET_REFRESH_TOKEN) return;
  const user = await db.findUserByEmail(req.body.email);
  if (!user)
    return res.status(404).json(db.returnErrorData('cannot find user', 404));

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const refreshToken = jwt.sign(
        JSON.parse(JSON.stringify(user)),
        process.env.SECRET_REFRESH_TOKEN
      );

      const date = new Date();
      date.setTime(date.getTime() + 36500 * 24 * 60 * 60 * 1000);

      await db.updateRefreshToken(user._id, refreshToken);
      const latestUser = await db.findUserByRefreshToken(refreshToken);
      if (!latestUser)
        return res
          .status(404)
          .json(db.returnErrorData('cannot find user', 404));

      res.cookie('SSID', generateAccessToken(latestUser), {
        sameSite: 'strict', // lax, none
        path: '/',
        expires: date,
        httpOnly: true,
        secure: true,
      });
      return res.status(200).json(db.returnCurrentUser(latestUser));
    }
    return res.status(403).json({
      ...db.returnErrorData('Wrong Password. Please try again', 403),
      currentUser: null,
    });
  } catch (err) {
    return res.status(500).json({ err, message: 'Cannot Find User' }); // returnErrorData('', 500)
  }
};

export const logout = async (
  req: any, // AuthRequestType
  res: Response<any, Record<string, any>>
) => {
  try {
    await db.updateRefreshToken(req.user._id, '');
    res.clearCookie('SSID');
    return res.status(200).json({ currentUser: null });
  } catch (error) {
    return res.status(500).json({ error, message: 'logout failed' });
  }
};

export const refreshToken = async (
  req: Request<{}, any, any, any, Record<string, any>>,
  res: Response<any, Record<string, any>>
) => {
  const { refreshToken }: { refreshToken: string } = req.body;
  if (refreshToken === null)
    return res
      .status(401)
      .json(db.returnErrorData('no refreshToken provided', 401));

  const tempUser = await db.findUserByRefreshToken(refreshToken);
  if (tempUser === null)
    return res
      .status(403)
      .json(db.returnErrorData('no refreshToken exist', 401));

  const date = new Date();
  date.setTime(date.getTime() + 36500 * 24 * 60 * 60 * 1000);

  if (process.env.SECRET_REFRESH_TOKEN) {
    jwt.verify(refreshToken, process.env.SECRET_REFRESH_TOKEN, (err, user) => {
      if (err)
        return res.sendStatus(403).json(db.returnErrorData(err.message, 403));

      res.cookie('SSID', generateAccessToken(tempUser), {
        sameSite: 'strict', // lax, none
        path: '/',
        expires: date,
        httpOnly: true,
        secure: true,
      });
      return res.status(200).json(db.returnCurrentUser(tempUser));
    });
  } else return res.status(500).json('internal server error');
};

export const deleteUser = async (
  req: any, // AuthRequestType
  res: Response<any, Record<string, any>>
) => {
  const { email, password, userId } = req.body;
  if (req.user._id === userId) {
    const tempUser = await db.findUserByEmail(email);
    if (tempUser === null)
      return res.status(404).json(db.returnErrorData('Cannot find user', 404));

    if (await bcrypt.compare(password, tempUser.password)) {
      try {
        // const remove user = await User.deleteOne({_id: req.params.UserId})
        const removedUser = db.removeUser(userId);
        return res.status(204).json({ removedUser });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    }
    return res.status(401).json(db.returnErrorData('wrong password', 401));
  } else {
    return res
      .status(403)
      .json(db.returnErrorData('trying to delete wrong user', 403));
  }
};

export const addProfile = async (
  req: any, // AuthRequestType
  res: Response<any, Record<string, any>>
) => {
  const { profileName, avatarURL }: { profileName: string; avatarURL: string } =
    req.body;
  if (!profileName || !avatarURL) {
    return res
      .status(400)
      .json(db.returnErrorData('no empty data in field', 400));
  }
  try {
    await User.updateOne(
      { id: req.user._id },
      {
        $push: {
          profiles: {
            profileName: profileName,
            avatarURL: avatarURL,
          },
        },
      }
    );
    res.status(204).json({ message: 'profile added' });
  } catch (error) {
    return res
      .status(500)
      .json(db.returnErrorData('server error while creating user', 500));
  }
};

export const getCurrentUser = async (
  req: any, // AuthRequestType
  res: Response<any, Record<string, any>>
) => {
  try {
    const user = await db.findUserById(req.user._id);
    if (!user)
      return res.status(404).json(db.returnErrorData('cannot find user', 404));

    return res.status(200).json(db.returnCurrentUser(user));
  } catch (error: any) {
    return res
      .status(500)
      .json(db.returnErrorData('internal server error', 500));
  }
};

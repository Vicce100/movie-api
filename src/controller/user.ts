import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import User from '../schemas/UserSchema.js';
import { generateAccessToken } from '../utilities/index.js';
import { UserType } from '../utilities/types.js';
import api from '../utilities/api/index.js';
import { v4 as uuidV4 } from 'uuid';

dotenv.config();

export const signUp = async (
  req: Request<{}, any, any, any, Record<string, any>>,
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
      .json(api.returnErrorData('no empty data in field', 400));
  if (await User.findOne({ email }))
    return res
      .status(400)
      .json(api.returnErrorData('username already taken', 404));

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
      .json(api.returnErrorData('server error while creating user', 500));
  }
};

export const login = async (
  req: Request<{}, any, any, any, Record<string, any>>,
  res: Response<any, Record<string, any>>
  // next: NextFunction
) => {
  if (!process.env.SECRET_REFRESH_TOKEN) return;
  const { email, password }: { email: string; password: string } = req.body;
  const user = await api.findUserByEmail<UserType>(email);
  if (!user)
    return res.status(404).json(api.returnErrorData('cannot find user', 404));

  try {
    if (await bcrypt.compare(password, user.password)) {
      const refreshToken = jwt.sign(
        JSON.parse(JSON.stringify(user)),
        process.env.SECRET_REFRESH_TOKEN
      );

      const date = new Date();
      date.setTime(date.getTime() + 36500 * 24 * 60 * 60 * 1000);

      await api.updateRefreshToken(user._id, refreshToken);
      res.cookie('SSID', generateAccessToken(user), {
        sameSite: 'strict', // lax, none
        path: '/',
        expires: date,
        httpOnly: true,
        secure: true,
      });
      return res.status(200).json(api.returnCurrentUser(user));
    }
    return res.status(403).json({
      ...api.returnErrorData('Wrong Password. Please try again', 403),
      currentUser: null,
    });
  } catch (err) {
    return res.status(500).json({ err, message: 'Cannot Find User' }); // returnErrorData('', 500)
  }
};

export const logout = async (
  req: any,
  res: Response<any, Record<string, any>>
  // next: NextFunction
) => {
  const { _id: userId } = <UserType>req.user;
  await api.removeRefreshToken(userId);
  return res.clearCookie('SSID').status(200).json({ currentUser: null });
};

export const refreshToken = async (
  req: Request<{}, any, any, any, Record<string, any>>,
  res: Response<any, Record<string, any>>
) => {
  const { refreshToken }: { refreshToken: string } = req.body;
  if (refreshToken === null)
    return res
      .status(401)
      .json(api.returnErrorData('no refreshToken provided', 401));

  const tempUser = await api.findUserByRefreshToken(refreshToken);
  if (tempUser === null)
    return res
      .status(403)
      .json(api.returnErrorData('no refreshToken exist', 401));

  if (process.env.SECRET_REFRESH_TOKEN) {
    jwt.verify(refreshToken, process.env.SECRET_REFRESH_TOKEN, (err, user) => {
      if (err)
        return res.sendStatus(403).json(api.returnErrorData(err.message, 403));

      const accessToken = generateAccessToken(tempUser);
      res.cookie('SSID', accessToken, {
        sameSite: 'strict', // lax, none
        path: '/',
        expires: new Date(new Date().getFullYear() + 100),
        httpOnly: true,
        secure: true,
      });
      return res.json({ accessToken });
    });
  } else return res.status(500).json('internal server error');
};

export const deleteUser = async (
  req: any,
  res: Response<any, Record<string, any>>
) => {
  const { email, password, userId } = req.body;
  if (req.user.id === userId) {
    const tempUser = await api.findUserByEmail<UserType>(email);
    if (tempUser === null)
      return res.status(404).json(api.returnErrorData('Cannot find user', 404));

    if (await bcrypt.compare(password, tempUser.password)) {
      try {
        // const remove user = await User.deleteOne({_id: req.params.UserId})
        const removedUser = await api.removeUser<UserType>(userId);
        return res.json({ removedUser });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    }
    return res.status(401).json(api.returnErrorData('wrong password', 401));
  } else {
    return res
      .status(403)
      .json(api.returnErrorData('trying to delete wrong user', 403));
  }
};

export const addProfile = async (
  req: any,
  res: Response<any, Record<string, any>>
) => {
  const { profileName, avatarURL }: { profileName: string; avatarURL: string } =
    req.body;
  if (!profileName || !avatarURL) {
    return res
      .status(400)
      .json(api.returnErrorData('no empty data in field', 400));
  }
  try {
    await User.updateOne(
      { id: req.user.id },
      {
        $push: {
          profiles: {
            profileName: profileName,
            avatarURL: avatarURL,
          },
        },
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json(api.returnErrorData('server error while creating user', 500));
  }
};

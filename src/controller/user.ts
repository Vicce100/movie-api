import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import db from '../utilities/db/index.js';
import userSchema from '../schemas/UserSchema.js';
import { generateAccessToken, emailIsValid } from '../utilities/index.js';
import { checkAuth, errorHandler } from '../utilities/middleware.js';
import {
  errorCode,
  UserAsCookie,
  userRoles,
  UsersRolesType,
} from '../utilities/types.js';
import {
  assertNonNullish,
  assertsValueToType,
} from '../utilities/assertions.js';
import { ip } from '../../app.js';
import profilesSchema from '../schemas/profilesSchema.js';

dotenv.config();
const userNotAuthObject = db.returnErrorData('user not authenticated.', 401);

export const signUp = async (
  req: Request,
  res: Response,
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

  if (await db.findUserByEmail(email))
    return res
      .status(400)
      .json(db.returnErrorData('username already taken', 400));

  try {
    emailIsValid(email);
    await new userSchema({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 10),
      moviesUploaded: [],
      seriesUploaded: [],
    })
      .save()
      .catch((err) => console.log(err));
    next();
  } catch (error: any) {
    if (error instanceof Error) {
      console.log(error);
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
    return res
      .status(500)
      .json(db.returnErrorData('server error while creating user', 500));
  }
};

export const login = async (req: Request, res: Response) => {
  if (!process.env.SECRET_REFRESH_TOKEN) return;
  const user = await db.findUserByEmail(req.body.email);
  console.log(user);
  if (!user)
    return res.status(404).json(db.returnErrorData('cannot find user', 404));

  const activeProfile = await db
    .findProfileByUserId(user._id)
    .catch((err) => console.log(err));
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

      const userAsCookie: UserAsCookie = {
        _id: latestUser._id,
        role: latestUser.role,
      };

      res.cookie('SSID', generateAccessToken(userAsCookie), {
        sameSite: 'strict', // lax, none, strict
        path: '/',
        expires: date,
        httpOnly: true,
        secure: false, // Only Use False For HTTPS And True For HTTPS
        domain: ip,
      });
      return res
        .status(200)
        .json(db.returnCurrentUser(latestUser, activeProfile || null));
    }
    return res.status(403).json({
      ...db.returnErrorData('Wrong Password. Please try again', 403),
      currentUser: null,
    });
  } catch (err) {
    return res.status(500).json({ err, message: 'Cannot Find User' }); // returnErrorData('', 500)
  }
};

export const logout = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json(userNotAuthObject);
  try {
    await db.updateRefreshToken(req.user._id, '');
    res.clearCookie('SSID');
    return res.status(200).json({ currentUser: null });
  } catch (error) {
    return res.status(500).json({ error, message: 'logout failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken }: { refreshToken: string } = req.body;
  if (refreshToken === null)
    return res
      .status(401)
      .json(db.returnErrorData('no refreshToken provided', 401));

  const tempUser = await db.findUserByRefreshToken(refreshToken);
  const activeProfiles = await db.findProfileByUserId(
    tempUser?._id as unknown as string
  );

  if (tempUser === null || !activeProfiles)
    return res
      .status(403)
      .json(db.returnErrorData('no refreshToken exist', 401));

  const date = new Date();
  date.setTime(date.getTime() + 36500 * 24 * 60 * 60 * 1000);

  if (process.env.SECRET_REFRESH_TOKEN) {
    jwt.verify(refreshToken, process.env.SECRET_REFRESH_TOKEN, (err, user) => {
      if (err)
        return res.sendStatus(403).json(db.returnErrorData(err.message, 403));

      const userAsCookie: UserAsCookie = {
        _id: tempUser._id,
        role: tempUser.role,
      };

      res.cookie('SSID', generateAccessToken(userAsCookie), {
        sameSite: 'strict', // lax, none, strict
        path: '/',
        expires: date,
        httpOnly: true,
        secure: false, // Only Use False For HTTP And True For HTTPS
        domain: ip,
      });
      return res
        .status(200)
        .json(db.returnCurrentUser(tempUser, activeProfiles));
    });
  } else return res.status(500).json('internal server error');
};

export const deleteUser = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json(userNotAuthObject);
  const { email, password, userId } = req.body;
  if (req.user._id === userId) {
    const tempUser = await db.findUserByEmail(email);
    if (!tempUser)
      return res.status(404).json(db.returnErrorData('Cannot find user', 404));

    if (await bcrypt.compare(password, tempUser.password)) {
      try {
        // const remove user = await User.deleteOne({_id: req.params.UserId})
        const removedUser = await db.removeUser(userId);
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

export const addProfile = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json(userNotAuthObject);
  const { profileName, avatarId }: { profileName: string; avatarId: string } =
    req.body;

  if (!profileName || !avatarId)
    return res
      .status(400)
      .json(db.returnErrorData('no empty data in field', 400));

  try {
    const avatar = await db.findAvatarById(avatarId);
    assertNonNullish(avatar, errorCode.VALUE_MISSING);

    new profilesSchema({
      usersId: req.user._id,
      profileName: profileName,
      avatarURL: avatar.url,
      savedList: [],
      likedList: [],
      hasWatch: [],
      isWatchingMovie: [],
      isWatchingSeries: [],
    })
      .save()
      .catch((err) => console.log(err));

    res.status(204).json({ message: 'profile added' });
  } catch (error) {
    return res
      .status(500)
      .json(db.returnErrorData('server error while creating user', 500));
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json(userNotAuthObject);
  try {
    const user = await db.findUserById(req.user._id);
    const activeProfile = await db.findProfileByUserId(req.user._id);

    if (!user || !activeProfile)
      return res.status(404).json(db.returnErrorData('cannot find user', 404));

    return res.status(200).json(db.returnCurrentUser(user, activeProfile));
  } catch (error: any) {
    return res
      .status(500)
      .json(db.returnErrorData('internal server error', 500));
  }
};

export const checkAuthFunction = (req: Request, res: Response) => {
  if (!checkAuth(req.cookies))
    return res.status(401).json({ isLoggedIn: false });
  return res.status(200).json({ isLoggedIn: true });
};

export const checkAuthRole = (req: Request, res: Response) => {
  const roleType = req.params.roleType.toLocaleLowerCase();
  if (
    roleType === userRoles.user ||
    userRoles.moderator ||
    userRoles.admin ||
    userRoles.superAdmin
  ) {
    assertsValueToType<UsersRolesType>(roleType);
    const user = checkAuth(req.cookies);
    const usersRole = user.role.toLocaleLowerCase();

    if (!user) return res.status(401).json({ access: false });

    if (roleType === usersRole) return res.status(200).json({ access: true });
    else if (roleType === userRoles.admin && usersRole === userRoles.superAdmin)
      return res.status(200).json({ access: true });
    else if (
      roleType === userRoles.moderator &&
      (usersRole === userRoles.superAdmin || userRoles.admin)
    )
      return res.status(200).json({ access: true });
    else return res.status(401).json({ access: false });
  } else
    return res
      .status(404)
      .json({ message: 'route dose not exist', access: false });
};

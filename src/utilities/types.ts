import { Request } from 'express';

const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const host = process.env.NODE_ENV === 'production' ? 'localhost' : 'localhost';
const port = process.env.NODE_ENV === 'production' ? '3000' : '5050';
export const url = `${protocol}://${host}:${port}`;

export const jpeg = 'image/jpeg';
export const jpg = 'image/jpg';
export const png = 'image/png';
export const mp4 = 'video/mp4';

export const MulterErrorCode: {
  LIMIT_PART_COUNT: 'LIMIT_PART_COUNT';
  LIMIT_FILE_SIZE: 'LIMIT_FILE_SIZE';
  LIMIT_FILE_COUNT: 'LIMIT_FILE_COUNT';
  LIMIT_FIELD_KEY: 'LIMIT_FIELD_KEY';
  LIMIT_FIELD_VALUE: 'LIMIT_FIELD_VALUE';
  LIMIT_FIELD_COUNT: 'LIMIT_FIELD_COUNT';
  LIMIT_UNEXPECTED_FILE: 'LIMIT_UNEXPECTED_FILE';
} = {
  LIMIT_PART_COUNT: 'LIMIT_PART_COUNT',
  LIMIT_FILE_SIZE: 'LIMIT_FILE_SIZE',
  LIMIT_FILE_COUNT: 'LIMIT_FILE_COUNT',
  LIMIT_FIELD_KEY: 'LIMIT_FIELD_KEY',
  LIMIT_FIELD_VALUE: 'LIMIT_FIELD_VALUE',
  LIMIT_FIELD_COUNT: 'LIMIT_FIELD_COUNT',
  LIMIT_UNEXPECTED_FILE: 'LIMIT_UNEXPECTED_FILE',
};

export const errorCode: {
  NOT_AUTHENTICATED: 'user not authenticated';
  ACCESS_WRONG_USER: 'trying to access wrong data';
  MISSING_ENV_TOKEN: 'missing env token';
} = {
  NOT_AUTHENTICATED: 'user not authenticated',
  ACCESS_WRONG_USER: 'trying to access wrong data',
  MISSING_ENV_TOKEN: 'missing env token',
};

export const userRoles: {
  user: 'user';
  moderator: 'moderator';
  admin: 'admin';
  superAdmin: 'superAdmin';
} = {
  user: 'user',
  moderator: 'moderator',
  admin: 'admin',
  superAdmin: 'superAdmin',
};

type UsersRolesType = 'user' | 'moderator' | 'admin' | 'superAdmin';
type UserStatusType = 'active' | 'disabled';

export interface VideoSchemaType {
  title: string;
  videoUrl: string;
  displayPicture: string;
  album: string[];
  categories: string[];
  description: string;
  creatorsId: string;
  uploadDate: string;
  releaseDate: string;
}

export interface CategorySchemaType {
  _id: string;
  name: string;
  // url: string;
}

export interface AvatarSchemaType {
  _id: string;
  categories: string;
  name: string;
  url: string;
}

export type ProfileType =
  | {
      _id: string;
      profileName: string;
      avatarURL: string;
    }[]
  | undefined;

export interface UserType {
  _id: string;
  email: string;
  refreshToken: string;
  password: string;
  firstName: string;
  lastName: string;
  profiles?: ProfileType; // never
  role: UsersRolesType;
  userStatus: UserStatusType;
  createdAt: string;
  videosUploaded: string;
}

export type CurrentUserType = {
  id: string;
  email: string;
  createdAt: string;
  refreshToken: string;
  firstName: string;
  lastName: string;
  profiles: ProfileType;
  role: UsersRolesType;
  userStatus: UserStatusType;
};

export interface AuthRequestType extends Omit<Request, 'user'> {
  user: UserType;
}

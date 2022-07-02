import { Request } from 'express';
import { Types } from 'mongoose';

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
  PERMISSION_DENIED: 'permission denied';
  VALUE_TAKEN: 'value already taken';
  VALUE_MISSING: 'value missing';
  INVALID_EMAIL: 'invalid email';
} = {
  NOT_AUTHENTICATED: 'user not authenticated',
  ACCESS_WRONG_USER: 'trying to access wrong data',
  MISSING_ENV_TOKEN: 'missing env token',
  PERMISSION_DENIED: 'permission denied',
  VALUE_TAKEN: 'value already taken',
  VALUE_MISSING: 'value missing',
  INVALID_EMAIL: 'invalid email',
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

export type ReturnedVideoData = {
  _id: Types.ObjectId;
  isMovie: boolean;
  title: string;
  episodeTitle: string | undefined;
  session: number | undefined;
  episode: number | undefined;
  seriesId: Types.ObjectId | undefined;
  videoUrl: string;
  displayPicture: string;
};

export interface SeriesInfoType {
  _id: Types.ObjectId;
  title: string;
  categories: string[];
  displayPicture: string;
  description: string;
  uploadDate: string;
  creationDate: string;
  latestDate: string;
  episodesId: Types.ObjectId[];
  amountOfSessions: number;
  creatorsId: Types.ObjectId;
}

export interface SeriesEpisodeType {
  _id: Types.ObjectId;
  session: number;
  episode: number;
  seriesId: Types.ObjectId;
  seriesTitle: string;
  episodeTitle: string;
  videoUrl: string;
  displayPicture: string;
  description: string;
  creatorsId: Types.ObjectId;
  uploadDate: string;
  releaseDate: string;
}

export interface MovieSchemaType {
  _id: Types.ObjectId;
  title: string;
  videoUrl: string;
  displayPicture: string;
  // album: string[];
  categories: string[];
  description: string;
  creatorsId: Types.ObjectId;
  uploadDate: string;
  releaseDate: string;
}

export interface CategorySchemaType {
  _id: Types.ObjectId;
  name: string;
  // url: string;
}

export interface AvatarSchemaType {
  _id: Types.ObjectId;
  categories: string;
  name: string;
  url: string;
}

export type ProfileType =
  | {
      _id: Types.ObjectId;
      profileName: string;
      avatarURL: string;
    }[]
  | undefined;

export interface UserType {
  _id: Types.ObjectId;
  email: string;
  refreshToken: string;
  password: string;
  firstName: string;
  lastName: string;
  profiles?: ProfileType; // never
  role: UsersRolesType;
  userStatus: UserStatusType;
  createdAt: string;
  videosUploaded: Types.ObjectId[];
}

export type CurrentUserType = {
  id: Types.ObjectId;
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

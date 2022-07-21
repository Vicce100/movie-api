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

export const MulterErrorCode = {
  LIMIT_PART_COUNT: 'LIMIT_PART_COUNT' as 'LIMIT_PART_COUNT',
  LIMIT_FILE_SIZE: 'LIMIT_FILE_SIZE' as 'LIMIT_FILE_SIZE',
  LIMIT_FILE_COUNT: 'LIMIT_FILE_COUNT' as 'LIMIT_FILE_COUNT',
  LIMIT_FIELD_KEY: 'LIMIT_FIELD_KEY' as 'LIMIT_FIELD_KEY',
  LIMIT_FIELD_VALUE: 'LIMIT_FIELD_VALUE' as 'LIMIT_FIELD_VALUE',
  LIMIT_FIELD_COUNT: 'LIMIT_FIELD_COUNT' as 'LIMIT_FIELD_COUNT',
  LIMIT_UNEXPECTED_FILE: 'LIMIT_UNEXPECTED_FILE' as 'LIMIT_UNEXPECTED_FILE',
};

export const errorCode = {
  NOT_AUTHENTICATED: 'user not authenticated' as const,
  ACCESS_WRONG_USER: 'trying to access wrong data' as const,
  MISSING_ENV_TOKEN: 'missing env token' as const,
  PERMISSION_DENIED: 'permission denied' as const,
  VALUE_TAKEN: 'value already taken' as const,
  VALUE_MISSING: 'value missing' as const,
  VALUE_NOT_EXISTING: 'value dose not exists' as const,
  INVALID_EMAIL: 'invalid email' as const,
};

export const userRoles = {
  user: 'user' as const,
  moderator: 'moderator' as const,
  admin: 'admin' as const,
  superAdmin: 'superAdmin' as const,
};

export const queryPaths = Object.freeze({
  myList: 'myList',
  continueWatching: 'continueWatching',
  watchAged: 'watchAged',
  becauseYouWatch: 'becauseYouWatch',
  becauseYouLiked: 'becauseYouLiked',
  forYou: 'forYou',
  newlyAdded: 'newlyAdded',
  popular: 'popular',
  top10movies: 'top10movies',
  top10series: 'top10series',
  randomMovie: 'randomMovie',
  randomSeries: 'randomSeries',
});

export type queryPathsString =
  | 'myList'
  | 'continueWatching'
  | 'watchAged'
  | 'becauseYouWatch'
  | 'becauseYouLiked'
  | 'forYou'
  | 'newlyAdded'
  | 'popular'
  | 'top10movies'
  | 'top10series'
  | 'randomMovie'
  | 'randomSeries';

export type UsersRolesType = 'user' | 'moderator' | 'admin' | 'superAdmin';
export type UserStatusType = 'active' | 'disabled';

export type ReturnedVideoData = {
  _id: Types.ObjectId;
  isMovie: boolean;
  previewImagesUrl: string[];
  title: string;
  episodeTitle: string | undefined;
  session: number | undefined;
  episode: number | undefined;
  seriesId: Types.ObjectId | undefined;
};

export interface SeriesInfoType {
  _id: Types.ObjectId;
  title: string;
  displayPicture: string;
  views: number;
  monthlyViews: number;
  public: boolean;
  categories: string[];
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
  sessionNr: number;
  episodeNr: number;
  seriesId: Types.ObjectId;
  seriesTitle: string;
  episodeTitle: string;
  public: boolean;
  videoUrl: string;
  previewImagesUrl: string[];
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
  previewImagesUrl: string[];
  displayPicture: string;
  public: boolean;
  categories: string[];
  description: string;
  views: number;
  monthlyViews: number;
  creatorsId: Types.ObjectId;
  uploadDate: string;
  releaseDate: string;
}

export interface CategorySchemaType {
  _id: Types.ObjectId;
  name: string;
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
      savedList?: Types.ObjectId[];
      likedList?: Types.ObjectId[];
      hasWatch?: Types.ObjectId[];
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
  moviesUploaded: Types.ObjectId[]; // videosUploaded
  seriesUploaded: Types.ObjectId[];
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

import { Model, Types } from 'mongoose';
import {
  AvatarSchemaType,
  CurrentUserType,
  ProfileType,
  UserType,
  url,
  MovieSchemaType,
  SeriesEpisodeType,
  ReturnedVideoData,
} from '../types.js';
import { assertsValueToType } from '../assertions.js';
import userSchema from '../../schemas/UserSchema.js';
import categorySchema from '../../schemas/categorySchema.js';
import avatarSchema from '../../schemas/avatarSchema.js';
import movieSchema from '../../schemas/movieSchema.js';

/* ----------------------- local ----------------------- */

const setFieldWithId = <T>(
  dataPoint: Model<T>,
  userId: Types.ObjectId | string,
  valueToUpdate: unknown
) => dataPoint.updateOne({ _id: userId }, { $set: { valueToUpdate } });

/* ----------------------- user ----------------------- */

const findUserByEmail = (value: string | number) =>
  userSchema.findOne({ email: value });

const findUserById = (id: Types.ObjectId | string) => userSchema.findById(id);

const findUserByRefreshToken = (refreshToken: string) =>
  userSchema.findOne({ refreshToken });

const removeUser = (userId: Types.ObjectId | string) =>
  userSchema.remove({ _id: userId });

const updatePassword = (
  userId: Types.ObjectId | string,
  valueToUpdate: string | null
) => setFieldWithId(userSchema, userId, valueToUpdate);

const updateRefreshToken = (
  userId: Types.ObjectId,
  refreshToken: string | null
) =>
  userSchema.updateOne(
    { _id: userId },
    { $set: { refreshToken: refreshToken } }
  );

const removeRefreshToken = (userId: Types.ObjectId | string) =>
  userSchema
    .findOne<UserType>({ _id: userId })
    .then((user: UserType | null) =>
      userSchema.updateOne(
        { _id: userId },
        { $unset: { refreshToken: user?.refreshToken || '' } }
      )
    );

const removeUsersVideoRef = (
  userId: Types.ObjectId | string,
  videoId: Types.ObjectId | string
) =>
  userSchema.updateOne(
    { _id: userId },
    { $pullAll: { videosUploaded: videoId } }
  );

const addProfileToUser = (userId: Types.ObjectId | string, data: ProfileType) =>
  userSchema.updateOne({ _id: userId }, { $push: { profiles: data } });

const EmailTaken = async (email: string) =>
  (await findUserByEmail(email)) ? true : false;

/* ----------------------- category ----------------------- */

const getSingleCategoryBaId = (categoryId: Types.ObjectId | string) =>
  categorySchema.findOne({ _id: categoryId });

const getSingleCategoryBaName = (categoryName: string) =>
  categorySchema.findOne({ name: categoryName });

const getAllCategories = () => categorySchema.find();

/* ----------------------- avatar ----------------------- */

const getSingleAvatarById = (avatarId: Types.ObjectId | string) =>
  avatarSchema.findOne({ _id: avatarId });

const getAllAvatars = () => avatarSchema.find();

/* ----------------------- video ----------------------- */

const addUsersMovie = (
  userId: Types.ObjectId | string,
  videoId: Types.ObjectId | string
) =>
  userSchema.updateOne({ _id: userId }, { $push: { movieUploaded: videoId } });

const addUsersSeries = (
  userId: Types.ObjectId | string,
  videoId: Types.ObjectId | string
) =>
  userSchema.updateOne({ _id: userId }, { $push: { seriesUploaded: videoId } });

const findVideoById = (videoId: Types.ObjectId | string) =>
  movieSchema.findOne({ _id: videoId });

const findVideoByName = (videoTitle: string) =>
  movieSchema.findOne({ title: videoTitle });

const getVideoDataByCategory = (categoryName: string) =>
  movieSchema.find(
    { categories: categoryName },
    { _id: 1, title: 1, displayPicture: 1 }
  );

const updateVideoPreviewImages = (
  videoId: Types.ObjectId | string,
  imageArray: string[]
) =>
  movieSchema.updateOne(
    { _id: videoId },
    { $push: { previewImagesUrl: { $each: imageArray } } }
  );

const deleteVideoPreviewImages = (videoId: Types.ObjectId | string) =>
  movieSchema.updateOne({ _id: videoId }, { $unset: { previewImagesUrl: '' } });

const resetMoviesMonthlyViews = () =>
  movieSchema.updateMany({}, { $set: { monthlyViews: 0 } });

const addViewToMovie = (videoId: Types.ObjectId | string) =>
  movieSchema.updateOne({ _id: videoId }, { $inc: { views: 1 } });

const addMonthlyViewToMovie = (videoId: Types.ObjectId | string) =>
  movieSchema.updateOne({ _id: videoId }, { $inc: { monthlyViews: 1 } });

/* ----------------------- returned values ----------------------- */

const returnAvatar = (data: AvatarSchemaType) => {
  return {
    id: data?._id,
    name: data?.name,
    url: `${url}/${data?.url}`,
    urlPath: data?.url,
    categories: data?.categories,
  };
};

const returnErrorData = (message: string, status: string | number) => ({
  message,
  status: String(status),
});

const returnCurrentUser = (
  user: UserType
): { currentUser: CurrentUserType } => ({
  currentUser: {
    id: user._id,
    email: user.email,
    createdAt: user.createdAt,
    refreshToken: user.refreshToken,
    firstName: user.firstName,
    lastName: user.lastName,
    profiles:
      user?.profiles?.map(({ _id, profileName, avatarURL, savedList }) => ({
        _id,
        profileName,
        avatarURL: `${url}/${avatarURL}`,
        savedList,
      })) || undefined,
    role: user.role,
    userStatus: user.userStatus,
  },
});

export const returnVideo = (
  video: MovieSchemaType | SeriesEpisodeType,
  isMovie: boolean
): ReturnedVideoData => {
  if (isMovie) {
    assertsValueToType<MovieSchemaType>(video);
    return {
      _id: video._id,
      isMovie: isMovie,
      previewImagesUrl: video.previewImagesUrl.map(
        (image) => `${url}/${image}`
      ),
      title: video.title,
      episodeTitle: undefined,
      session: undefined,
      episode: undefined,
      seriesId: undefined,
    };
  } else {
    assertsValueToType<SeriesEpisodeType>(video);
    return {
      _id: video._id,
      isMovie: isMovie,
      previewImagesUrl: video.previewImagesUrl,
      title: video.seriesTitle,
      episodeTitle: video.episodeTitle,
      session: video.sessionNr,
      episode: video.episodeNr,
      seriesId: video.seriesId,
    };
  }
};

export default {
  findUserByEmail,
  findUserById,
  findUserByRefreshToken,
  removeUser,
  addProfileToUser,
  updatePassword,
  addUsersMovie,
  addUsersSeries,
  updateRefreshToken,
  removeRefreshToken,
  removeUsersVideoRef,
  EmailTaken,
  getSingleCategoryBaId,
  getSingleCategoryBaName,
  getAllCategories,
  getSingleAvatarById,
  findVideoById,
  findVideoByName,
  getVideoDataByCategory,
  updateVideoPreviewImages,
  deleteVideoPreviewImages,
  resetMoviesMonthlyViews,
  addViewToMovie,
  addMonthlyViewToMovie,
  getAllAvatars,
  returnErrorData,
  returnCurrentUser,
  returnAvatar,
  returnVideo,
};

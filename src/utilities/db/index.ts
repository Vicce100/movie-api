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
  SeriesInfoType,
} from '../types.js';
import { assertsValueToType } from '../assertions.js';
import userSchema from '../../schemas/UserSchema.js';
import categorySchema from '../../schemas/categorySchema.js';
import avatarSchema from '../../schemas/avatarSchema.js';
import movieSchema from '../../schemas/movieSchema.js';
import seriesSchema from '../../schemas/seriesSchema.js';
import episodesSchema from '../../schemas/episodesSchema.js';

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

const findMovieById = (movieId: Types.ObjectId | string) =>
  movieSchema.findOne({ _id: movieId });

const findSeriesById = (seriesId: Types.ObjectId | string) =>
  seriesSchema.findOne({ _id: seriesId });

const findEpisodeById = (episodeId: Types.ObjectId | string) =>
  episodesSchema.findOne({ _id: episodeId });

const findMovieByName = (videoTitle: string) =>
  movieSchema.findOne({ title: videoTitle });

const findSeriesByName = (videoTitle: string) =>
  seriesSchema.findOne({ title: videoTitle });

const findEpisodeByName = (videoTitle: string) =>
  episodesSchema.findOne({ seriesTitle: videoTitle });

const getMovieDataByCategory = (categoryName: string) =>
  movieSchema.find(
    { categories: categoryName },
    { _id: 1, title: 1, displayPicture: 1 }
  );

const getSeriesDataByCategory = (categoryName: string) =>
  seriesSchema.find(
    { categories: categoryName },
    { _id: 1, title: 1, displayPicture: 1 }
  );

const updateMoviePreviewImages = (
  movieId: Types.ObjectId | string,
  imageArray: string[]
) =>
  movieSchema.updateOne(
    { _id: movieId },
    { $push: { previewImagesUrl: { $each: imageArray } } }
  );

const updateEpisodesPreviewImages = (
  seriesId: Types.ObjectId | string,
  imageArray: string[]
) =>
  episodesSchema.updateOne(
    { _id: seriesId },
    { $push: { previewImagesUrl: { $each: imageArray } } }
  );

const deleteMoviePreviewImages = (movieId: Types.ObjectId | string) =>
  movieSchema.updateOne({ _id: movieId }, { $unset: { previewImagesUrl: '' } });

const deleteEpisodePreviewImages = (episodeId: Types.ObjectId | string) =>
  episodesSchema.updateOne(
    { _id: episodeId },
    { $unset: { previewImagesUrl: '' } }
  );

const resetMoviesMonthlyViews = () =>
  movieSchema.updateMany({}, { $set: { monthlyViews: 0 } });

const resetSeriesMonthlyViews = () =>
  seriesSchema.updateMany({}, { $set: { monthlyViews: 0 } });

const addViewToMovie = (movieId: Types.ObjectId | string) =>
  movieSchema.updateOne({ _id: movieId }, { $inc: { views: 1 } });

const addViewToSeries = (seriesId: Types.ObjectId | string) =>
  seriesSchema.updateOne({ _id: seriesId }, { $inc: { views: 1 } });

const addMonthlyViewToMovie = (movieId: Types.ObjectId | string) =>
  movieSchema.updateOne({ _id: movieId }, { $inc: { monthlyViews: 1 } });

const addMonthlyViewToSeries = (seriesId: Types.ObjectId | string) =>
  seriesSchema.updateOne({ _id: seriesId }, { $inc: { monthlyViews: 1 } });

// https://www.mongodb.com/docs/upcoming/reference/operator/aggregation/sample/#pipe._S_sample
const getMyListInMovie = (MyListIds: Types.ObjectId[] | string[]) =>
  movieSchema.aggregate<MovieSchemaType>([
    { $match: { _id: { $in: MyListIds } } },
    { $sample: { size: MyListIds.length } },
  ]);

const getMyListInSeries = (MyListIds: Types.ObjectId[] | string[]) =>
  seriesSchema.aggregate<SeriesInfoType>([
    { $match: { _id: { $in: MyListIds } } },
    { $sample: { size: MyListIds.length } },
  ]);

const getWatchAgedInMovies = (hasWatchIds: Types.ObjectId[] | string[]) =>
  movieSchema.aggregate<MovieSchemaType>([
    { $match: { _id: { $in: hasWatchIds } } },
    { $sample: { size: hasWatchIds.length } },
  ]);

const getWatchAgedInSeries = (hasWatchIds: Types.ObjectId[] | string[]) =>
  seriesSchema.aggregate<SeriesInfoType>([
    { $match: { _id: { $in: hasWatchIds } } },
    { $sample: { size: hasWatchIds.length } },
  ]);

const getTop10Movies = () =>
  movieSchema.find().sort({ monthlyViews: -1 }).limit(10);

const getTop10Series = () =>
  seriesSchema.find().sort({ monthlyViews: -1 }).limit(10);

const randomMovie = (_movieId?: Types.ObjectId[] | string[]) =>
  movieSchema
    .aggregate<MovieSchemaType>([
      // { $match: { _id: { $in: movieId } } },
      { $sample: { size: 25 } },
      // { $sort: { monthlyViews: -1 } }, //  -1 highest value first | 1 lowest value first
    ])
    .limit(25);

const randomSeries = (_seriesId?: Types.ObjectId[] | string[]) =>
  seriesSchema
    .aggregate<SeriesInfoType>([
      // { $match: { _id: { $in: seriesId } } },
      { $sample: { size: 25 } },
      // { $sort: { monthlyViews: -1 } },
    ])
    .limit(25);

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
  findMovieById,
  findSeriesById,
  findEpisodeById,
  findMovieByName,
  findSeriesByName,
  findEpisodeByName,
  getMovieDataByCategory,
  getSeriesDataByCategory,
  updateMoviePreviewImages,
  updateEpisodesPreviewImages,
  deleteMoviePreviewImages,
  deleteEpisodePreviewImages,
  resetMoviesMonthlyViews,
  resetSeriesMonthlyViews,
  addViewToMovie,
  addViewToSeries,
  addMonthlyViewToMovie,
  addMonthlyViewToSeries,
  getMyListInMovie,
  getMyListInSeries,
  getWatchAgedInMovies,
  getWatchAgedInSeries,
  getTop10Movies,
  getTop10Series,
  randomMovie,
  randomSeries,
  getAllAvatars,
  returnErrorData,
  returnCurrentUser,
  returnAvatar,
  returnVideo,
};

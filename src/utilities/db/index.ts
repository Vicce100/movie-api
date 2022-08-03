import { Model, Types } from 'mongoose';
import {
  AvatarSchemaType,
  CurrentUserType,
  ProfileType,
  UserType,
  url,
  MovieSchemaType,
  EpisodeSchemaType,
  ReturnedVideoData,
  SeriesSchemaType,
  returnVideosArray,
  ReturnedSeriesSchemaType,
  EpisodesInSeriesSchema,
} from '../types.js';
import { assertsValueToType } from '../assertions.js';
import userSchema from '../../schemas/UserSchema.js';
import categorySchema from '../../schemas/categorySchema.js';
import avatarSchema from '../../schemas/avatarSchema.js';
import movieSchema from '../../schemas/movieSchema.js';
import seriesSchema from '../../schemas/seriesSchema.js';
import episodesSchema from '../../schemas/episodesSchema.js';
import franchiseSchema from '../../schemas/franchiseSchema.js';

/* ----------------------- local ----------------------- */

const querySize = 30;

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

const getSingleCategoryBayId = (categoryId: Types.ObjectId | string) =>
  categorySchema.findOne({ _id: categoryId });

const getSingleCategoryBayName = (categoryName: string) =>
  categorySchema.findOne({ name: categoryName });

const getAllCategories = () => categorySchema.find();

/* ----------------------- franchise ----------------------- */

const getSingleFranchiseBayId = (categoryId: Types.ObjectId | string) =>
  franchiseSchema.findOne({ _id: categoryId });

const getSingleFranchiseBayName = (categoryName: string) =>
  franchiseSchema.findOne({ name: categoryName });

const getAllFranchises = () => franchiseSchema.find();

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

const addViewToEpisode = (seriesId: Types.ObjectId | string) =>
  episodesSchema.updateOne({ _id: seriesId }, { $inc: { views: 1 } });

const addMonthlyViewToMovie = (movieId: Types.ObjectId | string) =>
  movieSchema.updateOne({ _id: movieId }, { $inc: { monthlyViews: 1 } });

const addMonthlyViewToSeries = (seriesId: Types.ObjectId | string) =>
  seriesSchema.updateOne({ _id: seriesId }, { $inc: { monthlyViews: 1 } });

const addAmountOfSessions = (
  seriesId: Types.ObjectId | string,
  amount?: number
) =>
  seriesSchema.updateOne(
    { _id: seriesId },
    { $inc: { amountOfSessions: amount || 1 } }
  );

const addAmountOfEpisodes = (
  seriesId: Types.ObjectId | string,
  amount?: number
) =>
  seriesSchema.updateOne(
    { _id: seriesId },
    { $inc: { amountOfEpisodes: amount || 1 } }
  );

const addEpisodeToSeriesField = (
  seriesId: Types.ObjectId | string,
  data: EpisodesInSeriesSchema
) => seriesSchema.updateOne({ _id: seriesId }, { $push: { episodes: data } });

// https://www.mongodb.com/docs/upcoming/reference/operator/aggregation/sample/#pipe._S_sample
const getMyListInMovie = (MyListIds: Types.ObjectId[] | string[]) =>
  movieSchema.aggregate<MovieSchemaType>([
    { $match: { _id: { $in: MyListIds } } },
    { $sample: { size: MyListIds.length } },
  ]);

const getMyListInSeries = (MyListIds: Types.ObjectId[] | string[]) =>
  seriesSchema.aggregate<SeriesSchemaType>([
    { $match: { _id: { $in: MyListIds } } },
    { $sample: { size: MyListIds.length } },
  ]);

const getWatchAgedInMovies = (hasWatchIds: Types.ObjectId[] | string[]) =>
  movieSchema.aggregate<MovieSchemaType>([
    { $match: { _id: { $in: hasWatchIds } } },
    { $sample: { size: hasWatchIds.length } },
  ]);

const getWatchAgedInSeries = (hasWatchIds: Types.ObjectId[] | string[]) =>
  seriesSchema.aggregate<SeriesSchemaType>([
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
      { $sample: { size: querySize } },
      // { $sort: { monthlyViews: -1 } }, //  -1 highest value first | 1 lowest value first
    ])
    .limit(querySize);

const randomSeries = (_seriesId?: Types.ObjectId[] | string[]) =>
  seriesSchema
    .aggregate<SeriesSchemaType>([
      // { $match: { _id: { $in: seriesId } } },
      { $sample: { size: querySize } },
      // { $sort: { monthlyViews: -1 } },
    ])
    .limit(querySize);

// array
// const randomMovieByCategory3 = (categoryName1 string[]) =>

const randomMovieByCategory = (categoryNames: string[]) =>
  movieSchema
    .aggregate<MovieSchemaType>([
      {
        $match: {
          categories: {
            $all: [...categoryNames],
          },
        },
      },
      { $sample: { size: querySize } },
    ])
    .limit(querySize);

const randomSeriesByCategory = (categoryNames: string[]) =>
  seriesSchema
    .aggregate<SeriesSchemaType>([
      { $match: { categories: { $all: [...categoryNames] } } },
      { $sample: { size: querySize } },
    ])
    .limit(querySize);

const randomMovieByFranchise = (franchise: string) =>
  movieSchema
    .aggregate<MovieSchemaType>([
      { $match: { franchise: franchise } },
      { $sample: { size: querySize } },
    ])
    .limit(querySize);

const randomSeriesByFranchise = (franchise: string) =>
  seriesSchema
    .aggregate<SeriesSchemaType>([
      { $match: { franchise: franchise } },
      { $sample: { size: querySize } },
    ])
    .limit(querySize);

const searchForMovies = (text: string) =>
  movieSchema
    .find({ title: { $regex: text, $options: '$i' } })
    .limit(querySize);

const searchForSeries = (text: string) =>
  seriesSchema
    .find({ title: { $regex: text, $options: '$i' } })
    .limit(querySize);

/* ----------------------- returned values ----------------------- */

const returnAvatar = (data: AvatarSchemaType) => {
  return {
    id: data._id,
    name: data.name,
    url: `${url}/${data.url}`,
    franchise: data.franchise,
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
      user?.profiles?.map(
        ({ _id, profileName, avatarURL, savedList, likedList, hasWatch }) => ({
          _id,
          profileName,
          avatarURL: `${url}/${avatarURL}`,
          savedList: savedList || [],
          likedList: likedList || [],
          hasWatch: hasWatch || [],
        })
      ) || undefined,
    role: user.role,
    userStatus: user.userStatus,
    moviesUploaded: user.moviesUploaded,
    seriesUploaded: user.seriesUploaded,
  },
});

const returnVideo = (
  video: MovieSchemaType | EpisodeSchemaType,
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
    assertsValueToType<EpisodeSchemaType>(video);
    return {
      _id: video._id,
      isMovie: isMovie,
      previewImagesUrl: video.previewImagesUrl,
      title: video.seriesTitle,
      episodeTitle: video.episodeTitle,
      session: video.seasonNr,
      episode: video.episodeNr,
      seriesId: video.seriesId,
    };
  }
};

const returnMovie = (movie: MovieSchemaType) => ({
  _id: movie._id,
  title: movie.title,
  videoUrl: movie.videoUrl,
  displayPicture: `${url}/${movie.displayPicture}`,
  previewImagesUrl: movie.previewImagesUrl.map((image) => `${url}/${image}`),
  public: movie.public,
  categories: movie.categories,
  franchise: movie.franchise,
  description: movie.description,
  views: movie.views,
  monthlyViews: movie.monthlyViews,
  creatorsId: movie.creatorsId,
  uploadDate: movie.uploadDate,
  releaseDate: movie.releaseDate,
});

const returnEpisode = (episode: EpisodeSchemaType) => ({
  _id: episode._id,
  seasonNr: episode.seasonNr,
  episodeNr: episode.episodeNr,
  seriesId: episode.seriesId,
  seriesTitle: episode.seriesTitle,
  episodeTitle: episode.episodeTitle,
  videoUrl: episode.videoUrl,
  previewImagesUrl: episode.previewImagesUrl.map((image) => `${url}/${image}`),
  views: episode.views,
  displayPicture: `${url}/${episode.displayPicture}`,
  description: episode.description,
  creatorsId: episode.creatorsId,
  uploadDate: episode.uploadDate,
  releaseDate: episode.releaseDate,
});

const returnSeries = (
  series: SeriesSchemaType
): ReturnedSeriesSchemaType | SeriesSchemaType => {
  const value = {
    _id: series._id,
    episodes: series.episodes,
    title: series.title,
    displayPicture: `${url}/${series.displayPicture}`,
    views: series.views,
    monthlyViews: series.monthlyViews,
    public: series.public,
    categories: series.categories,
    franchise: series.franchise,
    description: series.description,
    uploadDate: series.uploadDate,
    creationDate: series.creationDate,
    latestDate: series.latestDate,
    amountOfSessions: series.amountOfSessions,
    creatorsId: series.creatorsId,
  };

  if (!series.episodes) return value;

  const episodes: EpisodesInSeriesSchema[][] = [];

  for (let index = 0; index < series.amountOfSessions; index++)
    episodes.push(
      series.episodes
        .filter(({ seasonNr }) => seasonNr === index + 1)
        .sort((a, b) => a.episodeNr - b.episodeNr)
        .map((episode) => ({
          episodeId: episode.episodeId,
          episodeTitle: episode.episodeTitle,
          episodeDisplayPicture: `${url}/${episode.episodeDisplayPicture}`,
          episodeDescription: episode.episodeDescription,
          seasonNr: episode.seasonNr,
          episodeNr: episode.episodeNr,
        }))
    );

  return { ...value, episodes: episodes };
};

const returnMoviesArray = (movie: MovieSchemaType[]): returnVideosArray => {
  return movie.map((movie) => ({
    _id: movie._id,
    title: movie.title,
    isMovie: true,
    displayPicture: `${url}/${movie.displayPicture}`,
  }));
};

const returnSeriesArray = (series: SeriesSchemaType[]): returnVideosArray => {
  return series.map(({ _id, title, displayPicture }) => ({
    _id,
    title,
    isMovie: false,
    displayPicture: `${url}/${displayPicture}`,
  }));
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
  getSingleCategoryBayId,
  getSingleCategoryBayName,
  getAllCategories,
  getSingleFranchiseBayId,
  getSingleFranchiseBayName,
  getAllFranchises,
  getSingleAvatarById,
  getAllAvatars,
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
  addViewToEpisode,
  addMonthlyViewToMovie,
  addMonthlyViewToSeries,
  addAmountOfSessions,
  addAmountOfEpisodes,
  addEpisodeToSeriesField,
  getMyListInMovie,
  getMyListInSeries,
  getWatchAgedInMovies,
  getWatchAgedInSeries,
  getTop10Movies,
  getTop10Series,
  randomMovie,
  randomSeries,
  randomMovieByCategory,
  randomSeriesByCategory,
  randomMovieByFranchise,
  randomSeriesByFranchise,
  searchForMovies,
  searchForSeries,
  returnErrorData,
  returnCurrentUser,
  returnAvatar,
  returnVideo,
  returnMovie,
  returnEpisode,
  returnSeries,
  returnMoviesArray,
  returnSeriesArray,
};

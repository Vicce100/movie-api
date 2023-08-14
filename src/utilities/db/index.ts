import { Model, Types } from 'mongoose';
import { url } from '../../../app.js';
import {
  AvatarSchemaType,
  CurrentUserType,
  ProfileType,
  UserType,
  MovieSchemaType,
  EpisodeSchemaType,
  ReturnedVideoData,
  SeriesSchemaType,
  returnVideosArray,
} from '../types.js';
import { assertsValueToType } from '../assertions.js';
import userSchema from '../../schemas/UserSchema.js';
import profileSchema from '../../schemas/profilesSchema.js';
import categorySchema from '../../schemas/categorySchema.js';
import avatarSchema from '../../schemas/avatarSchema.js';
import movieSchema from '../../schemas/movieSchema.js';
import seriesSchema from '../../schemas/seriesSchema.js';
import episodeSchema from '../../schemas/episodeSchema.js';
import franchiseSchema from '../../schemas/franchiseSchema.js';

/* ----------------------- Local Start ----------------------- */

export const querySize = 54;

const setFieldWithId = <T>(
  dataPoint: Model<T>,
  id: Types.ObjectId | string,
  valueToUpdate: unknown
) => dataPoint.updateOne({ _id: id }, { $set: { valueToUpdate } });

/* ----------------------- Local End ----------------------- */

/* ----------------------- User Start ----------------------- */

const findUserByEmail = (value: string | number) =>
  userSchema.findOne({ email: value });

const findUserById = (id: Types.ObjectId | string) => userSchema.findById(id);

const findProfileById = (id: Types.ObjectId | string) =>
  profileSchema.findById(id);

const findProfileByUserId = (id: Types.ObjectId | string) =>
  profileSchema.find({ usersId: id });

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

const removeEpisodeRef = (
  userId: Types.ObjectId | string,
  episodeId: Types.ObjectId | string
) =>
  userSchema.updateOne(
    { _id: userId },
    { $pullAll: { seriesUploaded: episodeId } }
  );

const EmailTaken = async (email: string) =>
  (await findUserByEmail(email)) ? true : false;

/* ----------------------- User End ----------------------- */

/* ----------------------- Category Start ----------------------- */

const getSingleCategoryBayId = (categoryId: Types.ObjectId | string) =>
  categorySchema.findOne({ _id: categoryId });

const getSingleCategoryBayName = (categoryName: string) =>
  categorySchema.findOne({ name: categoryName });

const getAllCategories = () => categorySchema.find();

/* ----------------------- Category End ----------------------- */

/* ----------------------- Franchise Start ----------------------- */

const getSingleFranchiseBayId = (categoryId: Types.ObjectId | string) =>
  franchiseSchema.findOne({ _id: categoryId });

const getSingleFranchiseBayName = (categoryName: string) =>
  franchiseSchema.findOne({ name: categoryName });

const getAllFranchises = () => franchiseSchema.find();

/* ----------------------- Franchise end ----------------------- */

/* ----------------------- Avatar Start ----------------------- */

const findAvatarById = (avatarId: Types.ObjectId | string) =>
  avatarSchema.findOne({ _id: avatarId });

const findAvatarByUrl = (avatarUrl: Types.ObjectId | string) =>
  avatarSchema.findOne({ url: avatarUrl });

const getAllAvatars = () => avatarSchema.find();

/* ----------------------- Avatar End ----------------------- */

/* ----------------------- Video Start ----------------------- */

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
  movieSchema.findById(movieId);

const findSeriesById = (seriesId: Types.ObjectId | string) =>
  seriesSchema.findById(seriesId);

const findEpisodeById = (episodeId: Types.ObjectId | string) =>
  episodeSchema.findById(episodeId);

const findMovieByName = (videoTitle: string) =>
  movieSchema.findOne({ title: videoTitle });

const findSeriesByName = (videoTitle: string) =>
  seriesSchema.findOne({ title: videoTitle });

const findEpisodeByName = (videoTitle: string) =>
  episodeSchema.findOne({ seriesTitle: videoTitle });

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

const getSeriesEpisodes = (episodesIds: Types.ObjectId[]) =>
  episodeSchema.find({ _id: { $in: [...episodesIds] } });

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
  episodeSchema.updateOne(
    { _id: seriesId },
    { $push: { previewImagesUrl: { $each: imageArray } } }
  );

const deleteMoviePreviewImages = (movieId: Types.ObjectId | string) =>
  movieSchema.updateOne({ _id: movieId }, { $unset: { previewImagesUrl: '' } });

const deleteEpisodePreviewImages = (episodeId: Types.ObjectId | string) =>
  episodeSchema.updateOne(
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
  episodeSchema.updateOne({ _id: seriesId }, { $inc: { views: 1 } });

const addMonthlyViewToMovie = (movieId: Types.ObjectId | string) =>
  movieSchema.updateOne({ _id: movieId }, { $inc: { monthlyViews: 1 } });

const addMonthlyViewToSeries = (seriesId: Types.ObjectId | string) =>
  seriesSchema.updateOne({ _id: seriesId }, { $inc: { monthlyViews: 1 } });

const addAmountOfSessions = (
  seriesId: Types.ObjectId | string,
  amount?: number
) => {
  if (amount) {
    return seriesSchema.updateOne(
      { _id: seriesId },
      { $set: { amountOfSessions: amount } }
    );
  }
  return seriesSchema.updateOne(
    { _id: seriesId },
    { $inc: { amountOfSessions: 1 } }
  );
};

const addAmountOfEpisodes = (seriesId: Types.ObjectId | string) =>
  seriesSchema.updateOne({ _id: seriesId }, { $inc: { amountOfEpisodes: 1 } });

const addEpisodeToSeriesField = (
  seriesId: Types.ObjectId | string,
  episodeId: Types.ObjectId | string
) =>
  seriesSchema.updateOne({ _id: seriesId }, { $push: { episodes: episodeId } });

const addIdToSavedList = (
  profileId: string | Types.ObjectId,
  videoId: string | Types.ObjectId
) =>
  profileSchema.updateOne(
    { _id: profileId },
    { $push: { savedList: videoId } }
  );

const removeIdFromSavedList = (
  profileId: string | Types.ObjectId,
  videoId: string | Types.ObjectId
) =>
  profileSchema.updateOne(
    { _id: profileId },
    { $pull: { savedList: videoId } }
  );

const removeAllIdFromSavedList = (videoId: string | Types.ObjectId) =>
  profileSchema.updateMany({}, { $pull: { savedList: videoId } });

const addIdToLikedList = (
  profileId: string | Types.ObjectId,
  videoId: string | Types.ObjectId
) =>
  profileSchema.updateOne(
    { _id: profileId },
    { $push: { likedList: videoId } }
  );

const removeIdFromLikedList = (
  profileId: string | Types.ObjectId,
  videoId: string | Types.ObjectId
) =>
  profileSchema.updateOne(
    { _id: profileId },
    { $pull: { likedList: videoId } }
  );

const removeAllIdFromLikedList = (videoId: string | Types.ObjectId) =>
  profileSchema.updateMany({}, { $pull: { likedList: videoId } });

const addToForYouCategoryList = (
  profileId: string | Types.ObjectId,
  categoryName: string | Types.ObjectId
) =>
  profileSchema.updateOne(
    { _id: profileId },
    {
      $inc: {
        'forYouCategoryList.$[name].amount': 1,
      },
    },
    {
      arrayFilters: [{ 'name.categoryName': categoryName }],
    }
  );

const removeFromForYouCategoryList = (
  profileId: string | Types.ObjectId,
  categoryName: string | Types.ObjectId
) =>
  profileSchema.updateOne(
    { _id: profileId },
    {
      $inc: {
        'forYouCategoryList.$[name].amount': -1,
      },
    },
    {
      arrayFilters: [{ 'name.categoryName': categoryName }],
    }
  );

const removeAllFromForYouCategoryList = (
  categoryName: string | Types.ObjectId
) =>
  profileSchema.updateMany(
    {},
    {
      $inc: {
        'forYouCategoryList.$[name].amount': -1,
      },
    },
    {
      arrayFilters: [{ 'name.categoryName': categoryName }],
    }
  );

const getMoviesInfinityScroll = (skip: number, limit?: number) =>
  movieSchema
    .find()
    .sort('title')
    .select({ _id: 1, title: 1, isMovie: 1, displayPicture: 1 })
    .skip(skip)
    .limit(limit ? limit : querySize);

const getSeriesInfinityScroll = (skip: number, limit?: number) =>
  seriesSchema
    .find()
    .sort('title')
    .select({ _id: 1, title: 1, isMovie: 1, displayPicture: 1 })
    .skip(skip)
    .limit(limit ? limit : querySize);

const searchMoviesInfinityScroll = (
  text: string,
  skip: number,
  limit?: number
) =>
  movieSchema
    .find({ title: { $regex: text, $options: '$i' } })
    .sort('title')
    .select({ _id: 1, title: 1, isMovie: 1, displayPicture: 1 })
    .skip(skip)
    .limit(limit ? limit : querySize);

const searchSeriesInfinityScroll = (
  text: string,
  skip: number,
  limit?: number
) =>
  seriesSchema
    .find({ title: { $regex: text, $options: '$i' } })
    .sort('title')
    .select({ _id: 1, title: 1, isMovie: 1, displayPicture: 1 })
    .skip(skip)
    .limit(limit ? limit : querySize);

const addToMoviesWatched = (
  profileId: string | Types.ObjectId,
  data: {
    movieId: Types.ObjectId | string;
    trackId: number;
  }
) =>
  profileSchema.updateOne(
    {
      _id: profileId,
    },
    { $push: { isWatchingMovie: data } }
  );

const updateMoviesWatched = (
  profileId: string | Types.ObjectId,
  movieId: string | Types.ObjectId,
  trackId: number
) =>
  profileSchema.updateOne(
    { _id: profileId },
    {
      $set: {
        'isWatchingMovie.$[watchingMovieId].trackId': trackId,
      },
    },
    {
      arrayFilters: [{ 'watchingMovieId.movieId': movieId }],
    }
  );

const removeMovieWatched = (
  profileId: string | Types.ObjectId,
  movieId: string | Types.ObjectId
) =>
  profileSchema.updateOne(
    { _id: profileId },
    {
      $pull: { isWatchingMovie: { movieId: movieId } },
    }
  );

const addToSeriesWatched = (
  profileId: string | Types.ObjectId,
  data: ProfileType
) =>
  profileSchema.updateOne(
    {
      _id: profileId,
    },
    { $push: { isWatchingSeries: data } }
  );

const removeSeriesWatched = (
  profileId: string | Types.ObjectId,
  seriesId: string | Types.ObjectId
) =>
  profileSchema.updateOne(
    { _id: profileId },
    {
      $pull: {
        isWatchingSeries: { seriesId: seriesId },
      },
    }
  );

const removeEpisodeWatched = (
  profileId: string | Types.ObjectId,
  seriesId: Types.ObjectId | string
) =>
  profileSchema.updateOne(
    { _id: profileId },
    {
      $unset: {
        'isWatchingSeries.$[watchingSeriesId].activeEpisode': '',
      },
    },
    {
      arrayFilters: [{ 'watchingSeriesId.seriesId': seriesId }],
    }
  );

const setSeriesWatchedActiveEpisode = (
  profileId: string | Types.ObjectId,
  seriesId: Types.ObjectId | string,
  activeEpisode: {
    episodeId: Types.ObjectId | string;
    trackId: number;
  }
) =>
  profileSchema.updateOne(
    { _id: profileId },
    {
      $set: {
        'isWatchingSeries.$[watchingSeriesId].activeEpisode': activeEpisode,
      },
    },
    {
      arrayFilters: [{ 'watchingSeriesId.seriesId': seriesId }],
    }
  );

const updateSeriesWatchedActiveEpisode = (
  profileId: string | Types.ObjectId,
  seriesId: Types.ObjectId | string,
  trackId: number
) =>
  profileSchema.updateOne(
    { _id: profileId },
    {
      $set: {
        'isWatchingSeries.$[watchingSeriesId].activeEpisode.trackId': trackId,
      },
    },
    {
      arrayFilters: [{ 'watchingSeriesId.seriesId': seriesId }],
    }
  );

const addToSeriesWatchedEpisodes = (
  profileId: string | Types.ObjectId,
  seriesId: Types.ObjectId | string,
  data: {
    episodeId: Types.ObjectId | string;
    trackId: number;
  }
) =>
  profileSchema.updateOne(
    { _id: profileId },
    {
      $push: { 'isWatchingSeries.$[watchingSeriesID].watchedEpisodes': data },
    },
    {
      arrayFilters: [{ 'watchingSeriesID.seriesId': seriesId }],
    }
  );

const updateSeriesWatchedEpisode = (
  profileId: string | Types.ObjectId,
  seriesId: Types.ObjectId | string,
  episodeId: Types.ObjectId | string,
  trackId: number
) =>
  profileSchema.updateOne(
    { _id: profileId },
    {
      $set: {
        'isWatchingSeries.$[watchingSeriesID].watchedEpisodes.$[watchEpisode].trackId':
          trackId,
      },
    },
    {
      arrayFilters: [
        { 'watchingSeriesID.seriesId': seriesId },
        { 'watchEpisode.episodeId': episodeId },
      ],
    }
  );

// https://www.mongodb.com/docs/upcoming/reference/operator/aggregation/sample/#pipe._S_sample
const getMovieByIds = (movieIds: Types.ObjectId[] | string[]) =>
  movieSchema.aggregate<MovieSchemaType>([
    { $match: { _id: { $in: [...movieIds] } } },
    { $sample: { size: movieIds.length } },
    { $sort: { title: 1 } },
  ]);

const getSeriesByIds = (seriesIds: Types.ObjectId[] | string[]) =>
  seriesSchema.aggregate<SeriesSchemaType>([
    { $match: { _id: { $in: [...seriesIds] } } },
    { $sample: { size: seriesIds.length } },
    { $sort: { title: 1 } },
  ]);

const getEpisodesByIds = (episodeIds: Types.ObjectId[] | string[]) =>
  episodeSchema.aggregate<EpisodeSchemaType>([
    { $match: { _id: { $in: [...episodeIds] } } },
    { $sample: { size: episodeIds.length } },
    { $sort: { seriesTitle: 1 } },
  ]);

const getWatchAgedInMovies = (hasWatchIds: Types.ObjectId[] | string[]) =>
  movieSchema.aggregate<MovieSchemaType>([
    { $match: { _id: { $in: [...hasWatchIds] } } },
    { $sample: { size: hasWatchIds.length } },
  ]);

const getWatchAgedInSeries = (hasWatchIds: Types.ObjectId[] | string[]) =>
  seriesSchema.aggregate<SeriesSchemaType>([
    { $match: { _id: { $in: [...hasWatchIds] } } },
    { $sample: { size: hasWatchIds.length } },
  ]);

const getNewlyAddedMovies = () =>
  movieSchema.find().sort({ uploadDate: -1 }).limit(54);

const getNewlyAddedSeries = () =>
  seriesSchema.find().sort({ uploadDate: -1 }).limit(54);

const getLikedListIdsMovies = (likedListIds: Types.ObjectId[] | string[]) =>
  movieSchema.aggregate<MovieSchemaType>([
    { $match: { _id: { $in: [...likedListIds] } } },
    { $sample: { size: likedListIds.length } },
  ]);

const getLikedListSeries = (likedListIds: Types.ObjectId[] | string[]) =>
  seriesSchema.aggregate<SeriesSchemaType>([
    { $match: { _id: { $in: [...likedListIds] } } },
    { $sample: { size: likedListIds.length } },
  ]);

const getTop54Movies = () =>
  movieSchema.find().sort({ monthlyViews: -1 }).limit(54);

const getTop54Series = () =>
  seriesSchema.find().sort({ monthlyViews: -1 }).limit(54);

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

const randomMovieByCategory = (
  categoryNames: string[],
  excludeArray?: string[],
  limit?: number
) =>
  movieSchema
    .aggregate<MovieSchemaType>([
      {
        $match: {
          $and: [
            { categories: { $all: [...categoryNames] } },
            { categories: { $nin: excludeArray || [] } },
          ],
        },
      },
      { $sample: { size: limit ? limit : querySize } },
    ])
    .limit(limit ? limit : querySize);

const randomSeriesByCategory = (
  categoryNames: string[],
  excludeArray?: string[],
  limit?: number
) =>
  seriesSchema
    .aggregate<SeriesSchemaType>([
      {
        $match: {
          categories: { $all: [...categoryNames], $nin: excludeArray || [] },
        },
      },
      { $sample: { size: limit ? limit : querySize } },
    ])
    .limit(limit ? limit : querySize);

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

/* ----------------------- Video End ----------------------- */

/* ----------------------- Returned Values Start ----------------------- */

const returnAvatar = (data: AvatarSchemaType) => ({
  _id: data._id,
  name: data.name,
  url: `${url}/${data.url}`,
  franchise: data.franchise,
});

const returnErrorData = (message: string, status: string | number) => ({
  message,
  status: String(status),
});

const returnCurrentUser = (
  user: UserType,
  profiles: ProfileType[] | null
): { currentUser: CurrentUserType } => ({
  currentUser: {
    id: user._id,
    email: user.email,
    createdAt: user.createdAt,
    refreshToken: user.refreshToken,
    firstName: user.firstName,
    lastName: user.lastName,
    profiles:
      profiles?.map((profile) => {
        return {
          _id: profile._id,
          usersId: profile.usersId,
          profileName: profile.profileName,
          savedList: profile.savedList,
          likedList: profile.likedList,
          hasWatch: profile.hasWatch,
          forYouCategoryList: profile.forYouCategoryList,
          isWatchingMovie: profile.isWatchingMovie,
          isWatchingSeries: profile.isWatchingSeries,
          avatarURL: `${url}/${profile.avatarURL}`,
        };
      }) || null,
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

const returnMovie = (movie: MovieSchemaType): MovieSchemaType => ({
  _id: movie._id,
  title: movie.title,
  videoUrl: movie.videoUrl,
  displayPicture: `${url}/${movie.displayPicture}`,
  backdropPath: `${url}/${movie.backdropPath}`,
  previewImagesUrl: movie.previewImagesUrl.map((image) => `${url}/${image}`),
  public: movie.public,
  durationInMs: movie.durationInMs,
  creditsDurationInMs: movie.creditsDurationInMs,
  categories: movie.categories,
  franchise: movie.franchise,
  description: movie.description,
  views: movie.views,
  monthlyViews: movie.monthlyViews,
  creatorsId: movie.creatorsId,
  uploadDate: movie.uploadDate,
  releaseDate: movie.releaseDate,
});

const returnEpisode = (episode: EpisodeSchemaType): EpisodeSchemaType => ({
  _id: episode._id,
  seriesId: episode.seriesId,
  seriesTitle: episode.seriesTitle,
  episodeTitle: episode.episodeTitle,
  durationInMs: episode.durationInMs,
  videoUrl: `${url}/${episode.videoUrl}`,
  previewImagesUrl: episode.previewImagesUrl.map((image) => `${url}/${image}`),
  views: episode.views,
  displayPicture: `${url}/${episode.displayPicture}`,
  description: episode.description,
  creatorsId: episode.creatorsId,
  uploadDate: episode.uploadDate,
  releaseDate: episode.releaseDate,
  seasonNr: episode.seasonNr,
  episodeNr: episode.episodeNr,
});

const returnSeries = (series: SeriesSchemaType): SeriesSchemaType => ({
  _id: series._id,
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
  episodes: series.episodes,
  amountOfSessions: series.amountOfSessions,
  amountOfEpisodes: series.amountOfEpisodes,
  creatorsId: series.creatorsId,
});

const sortEpisodesArray = (
  episodes: EpisodeSchemaType[],
  amountOfSessions: number
): EpisodeSchemaType[][] => {
  const episodesArray: EpisodeSchemaType[][] = [];

  for (let index = 0; index < amountOfSessions; index++) {
    episodesArray.push(
      episodes
        .filter(({ seasonNr }) => seasonNr === index + 1)
        .map((episode): EpisodeSchemaType => {
          return {
            _id: episode._id,
            seriesId: episode.seriesId,
            seriesTitle: episode.seriesTitle,
            episodeTitle: episode.episodeTitle,
            durationInMs: episode.durationInMs,
            videoUrl: `${url}/${episode.videoUrl}`,
            previewImagesUrl: episode.previewImagesUrl.map(
              (image) => `${url}/${image}`
            ),
            views: episode.views,
            displayPicture: `${url}/${episode.displayPicture}`,
            description: episode.description,
            creatorsId: episode.creatorsId,
            uploadDate: episode.uploadDate,
            releaseDate: episode.releaseDate,
            seasonNr: episode.seasonNr,
            episodeNr: episode.episodeNr,
          };
        })
        .sort((a, b) => a.episodeNr - b.episodeNr)
    );
  }

  return episodesArray;
};

const returnMoviesArray = (movie: MovieSchemaType[]): returnVideosArray =>
  movie.map((movie) => ({
    _id: movie._id,
    title: movie.title,
    isMovie: true,
    displayPicture: `${url}/${movie.displayPicture}`,
  }));

const returnSeriesArray = (series: SeriesSchemaType[]): returnVideosArray =>
  series.map(({ _id, title, displayPicture }) => ({
    _id,
    title,
    isMovie: false,
    displayPicture: `${url}/${displayPicture}`,
  }));

/* ----------------------- Returned Values End ----------------------- */

export default {
  findUserByEmail,
  findUserById,
  findProfileById,
  findProfileByUserId,
  findUserByRefreshToken,
  removeUser,
  updatePassword,
  addUsersMovie,
  addUsersSeries,
  updateRefreshToken,
  removeRefreshToken,
  removeUsersVideoRef,
  removeEpisodeRef,
  EmailTaken,
  getSingleCategoryBayId,
  getSingleCategoryBayName,
  getAllCategories,
  getSingleFranchiseBayId,
  getSingleFranchiseBayName,
  getAllFranchises,
  findAvatarById,
  findAvatarByUrl,
  getAllAvatars,
  findMovieById,
  findSeriesById,
  findEpisodeById,
  findMovieByName,
  findSeriesByName,
  findEpisodeByName,
  getMovieDataByCategory,
  getSeriesDataByCategory,
  getSeriesEpisodes,
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
  addIdToSavedList,
  removeIdFromSavedList,
  removeAllIdFromSavedList,
  addIdToLikedList,
  removeIdFromLikedList,
  removeAllIdFromLikedList,
  addToForYouCategoryList,
  removeFromForYouCategoryList,
  removeAllFromForYouCategoryList,
  getMoviesInfinityScroll,
  getSeriesInfinityScroll,
  searchMoviesInfinityScroll,
  searchSeriesInfinityScroll,
  addToMoviesWatched,
  addToSeriesWatched,
  removeEpisodeWatched,
  removeSeriesWatched,
  setSeriesWatchedActiveEpisode,
  updateSeriesWatchedActiveEpisode,
  addToSeriesWatchedEpisodes,
  updateSeriesWatchedEpisode,
  updateMoviesWatched,
  removeMovieWatched,
  getMovieByIds,
  getSeriesByIds,
  getEpisodesByIds,
  getWatchAgedInMovies,
  getWatchAgedInSeries,
  getNewlyAddedMovies,
  getNewlyAddedSeries,
  getLikedListIdsMovies,
  getLikedListSeries,
  getTop54Movies,
  getTop54Series,
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
  sortEpisodesArray,
  returnSeries,
  returnMoviesArray,
  returnSeriesArray,
};

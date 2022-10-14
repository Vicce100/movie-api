import { Request, Response } from 'express';
import fs from 'fs';
import { getVideoDurationInSeconds } from 'get-video-duration';

import movieSchema from '../schemas/movieSchema.js';
import seriesSchema from '../schemas/seriesSchema.js';
import episodesSchema from '../schemas/episodeSchema.js';
import db from '../utilities/db/index.js';
import {
  errorCode,
  mp4,
  queryPaths,
  queryPathsString,
  returnVideosArray,
} from '../utilities/types.js';
import {
  assertNonNullish,
  assertIsNonEmptyArray,
  assertsValueToType,
  assertsQueryPaths,
  assertsIsString,
  assertNullish,
  assertUndefined,
} from '../utilities/assertions.js';
import { errorHandler } from '../utilities/middleware.js';
import {
  cleanString,
  deleteFile,
  generatePreviewImages,
  shuffleArray,
} from '../utilities/index.js';
import { Types } from 'mongoose';

export const getMovie = async (req: Request, res: Response) => {
  const { range } = req.headers;
  const { movieId } = req.params;

  // on linux the if statement will get trigger on the first request even
  // if range header is set to "bytes=0-"
  // if (!range) return res.status(404).send('Missing Requires Range header! ');

  try {
    const tempVideo = await db.findMovieById(movieId);
    assertNonNullish(tempVideo, errorCode.VALUE_MISSING);

    const videoPath = tempVideo.videoUrl;
    const videoSize = fs.statSync(videoPath).size;
    // const chunkSize = 1 * 1e6; // 1MB

    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range?.replace(/\D/g, '') || 'bytes=0-');
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1, // contentLength
      'Content-Type': mp4,
    });

    const stream = fs.createReadStream(videoPath, { start, end });
    stream.pipe(res);
    stream.on('connection', (connect) => {
      connect.on('close', (close: any) => {
        console.log(close);
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getEpisode = async (req: Request, res: Response) => {
  const { range } = req.headers;
  const { episodeId } = req.params;

  // on linux the if statement will get trigger on the first request even
  // if range header is set to "bytes=0-"
  // if (!range) return res.status(404).send('Missing Requires Range header! ');

  try {
    const tempVideo = await db.findEpisodeById(episodeId);
    assertNonNullish(tempVideo, errorCode.VALUE_MISSING);

    const videoPath = tempVideo.videoUrl;
    const videoSize = fs.statSync(videoPath).size;
    // const chunkSize = 1 * 1e6; // 1MB

    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range?.replace(/\D/g, '') || 'bytes=0-');
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1, // contentLength
      'Content-Type': mp4,
    });

    const stream = fs.createReadStream(videoPath, { start, end });
    stream.pipe(res);
    stream.on('connection', (connect) => {
      connect.on('close', (close: any) => {
        console.log(close);
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const addView = async (req: Request, res: Response) => {
  const { videoId, isMovie }: { videoId: string; isMovie: boolean } = req.body;
  try {
    if (isMovie) {
      await db.addViewToMovie(videoId);
      await db.addMonthlyViewToMovie(videoId);
    } else {
      // videoId === episodeId
      const episode = await db.findEpisodeById(videoId);
      assertNonNullish(episode, errorCode.VALUE_MISSING);

      await db.addViewToEpisode(videoId);
      await db.addViewToSeries(episode.seriesId);
      await db.addMonthlyViewToSeries(episode.seriesId);
    }
  } catch (error: any) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message || error });
  }
  res.status(200).json({ success: true });
};

export const uploadMovie = async (req: Request, res: Response) => {
  const { files } = req;
  const {
    title,
    description,
    categories,
    franchise,
    releaseDate,
    isPublic,
  }: {
    title: string;
    description: string;
    categories: string[] | string;
    franchise: string[] | string;
    releaseDate: string;
    isPublic?: boolean;
  } = req.body;

  if (!files || !categories || !title)
    return res.status(404).json('wrong filled value was uploaded!');

  if (!Array.isArray(files)) {
    let tempCategory: string[] | null = null;
    let tempFranchises: string[] | null = null;

    if (!Array.isArray(categories)) tempCategory = [categories];
    else tempCategory = categories.map((tempCategory) => tempCategory);

    if (!Array.isArray(franchise)) tempFranchises = [franchise];
    else tempFranchises = franchise.map((tempFranchise) => tempFranchise);

    const duration = await getVideoDurationInSeconds(files.videoFile[0].path);

    try {
      const newMovie = new movieSchema({
        title,
        videoUrl: files.videoFile[0].path,
        displayPicture: files.displayPicture[0].path,
        previewImagesUrl: [],
        durationInMs: duration * 1000,
        categories: tempCategory,
        franchise: tempFranchises,
        description,
        creatorsId: req.user._id,
        releaseDate,
        public: isPublic || true,
        views: 0,
      });
      const { _id, videoUrl } = newMovie;
      await newMovie.save();
      await db.addUsersMovie(req.user._id, _id);

      // send response to client before running ffmpeg so client gets a faster response time
      res.status(201).json({ success: true });

      const previewImageArray = await generatePreviewImages({
        videoUrl: videoUrl,
        outputPathAndFileName: `uploads/images/ffmpeg/${cleanString(title)}`, // no increment or extension
        fps: 1 / 10,
        resolution: '1920x1080',
      });

      await db.updateMoviePreviewImages(_id, previewImageArray);
    } catch (error) {
      console.log(error);
    }
  } else {
    const message = 'number of files dose not match number of titles';
    return res.status(400).json(db.returnErrorData(message, 400));
  }
};

export const createSeries = async (req: Request, res: Response) => {
  const { file } = req;
  const {
    title,
    description,
    categories,
    franchise,
    creationDate,
    latestDate,
    isPublic,
  }: {
    title: string;
    description: string;
    categories: string[] | string;
    franchise: string[] | string;
    creationDate: string;
    latestDate: string;
    isPublic?: string;
  } = req.body;

  let tempCategory: string[] | null = null;
  let tempFranchises: string[] | null = null;

  if (!Array.isArray(categories)) tempCategory = [categories];
  else tempCategory = categories.map((tempCategory) => tempCategory);

  if (!Array.isArray(franchise)) tempFranchises = [franchise];
  else tempFranchises = franchise.map((tempFranchise) => tempFranchise);

  try {
    assertNonNullish(file, errorCode.VALUE_MISSING);
    const series = new seriesSchema({
      title,
      displayPicture: file.path,
      views: 0,
      categories: tempCategory,
      franchise: tempFranchises,
      description,
      creatorsId: req.user._id,
      creationDate,
      latestDate,
      public: Boolean(isPublic) || true,
      amountOfSessions: 0,
      amountOfEpisodes: 0,
      episodes: [],
    });
    await series.save();
    await db.addUsersSeries(req.user._id, series._id);

    res.status(201).json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const addEpisodesTOSeries = async (req: Request, res: Response) => {
  const { files } = req;
  const {
    seriesId,
    episodeTitle,
    description,
    releaseDate,
    seasonNr,
    episodeNr,
  }: {
    seriesId: string;
    episodeTitle: string;
    description: string;
    releaseDate: string;
    seasonNr: string;
    episodeNr: string;
  } = req.body;
  assertNonNullish(files, errorCode.WRONG_VALUE);

  try {
    if (Array.isArray(files)) throw new Error(errorCode.WRONG_VALUE);

    const series = await db.findSeriesById(seriesId);
    assertNonNullish(series, errorCode.VALUE_MISSING);

    const duration = await getVideoDurationInSeconds(files.videoFile[0].path);

    const episode = new episodesSchema({
      seriesTitle: series.title,
      episodeTitle,
      seriesId,
      durationInMs: duration * 1000,
      videoUrl: files.videoFile[0].path,
      displayPicture: files.displayPicture[0].path,
      previewImagesUrl: [],
      views: 0,
      description,
      releaseDate,
      seasonNr: Number(seasonNr),
      episodeNr: Number(episodeNr),
      creatorsId: req.user._id,
    });
    await episode.save();

    const response = await db.addEpisodeToSeriesField(seriesId, episode._id);

    if (Number(seasonNr) > series.amountOfSessions)
      await db.addAmountOfSessions(series._id, Number(seasonNr));

    await db.addAmountOfEpisodes(series._id);
    res.status(201).json({ success: response.acknowledged });

    const previewImageArray = await generatePreviewImages({
      videoUrl: episode.videoUrl,
      outputPathAndFileName: `uploads/images/ffmpeg/${cleanString(
        episode.episodeTitle
      )}`, // no increment or extension
      fps: 1 / 10,
      resolution: '1920x1080',
    });

    await db.updateEpisodesPreviewImages(episode._id, previewImageArray);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const deleteMovie = async (req: Request, res: Response) => {
  const { movieId } = req.params;
  const { _id: userId } = req.user;

  try {
    const movie = await db.findMovieById(movieId);
    assertNonNullish(movie, errorCode.VALUE_MISSING);
    if (userId !== movie.creatorsId)
      throw new Error(errorCode.PERMISSION_DENIED);

    deleteFile(movie.videoUrl);
    deleteFile(movie.displayPicture);

    for (let index = 0; index < movie.previewImagesUrl.length; index++) {
      deleteFile(movie.previewImagesUrl[index]);
    }

    (await movie.remove()).save();
    await db.removeUsersVideoRef(req.user._id, movieId);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const deleteSeries = async (req: Request, res: Response) => {
  const { seriesId } = req.params;
  const { _id: userId } = req.user;

  try {
    const series = await db.findSeriesById(seriesId);
    assertNonNullish(series, errorCode.VALUE_MISSING);
    if (userId !== series.creatorsId)
      throw new Error(errorCode.PERMISSION_DENIED);

    deleteFile(series.displayPicture);

    one: for (let index1 = 0; index1 < series.episodes.length; index1++) {
      const episode = await episodesSchema.findOne(
        { _id: series.episodes[index1] },
        { videoUrl: 1, previewImagesUrl: 1, displayPicture: 1 }
      );
      if (episode === null) continue one;
      deleteFile(episode.videoUrl);
      deleteFile(episode.displayPicture);

      episode.previewImagesUrl.forEach((value) => deleteFile(value));
    }

    (await series.remove()).save();
    await db.removeEpisodeRef(userId, seriesId);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const deleteEpisode = async (req: Request, res: Response) => {
  const { episodeId } = req.params;
  const { _id: userId } = req.user;

  try {
    const episode = await db.findEpisodeById(episodeId);
    assertNonNullish(episode, errorCode.VALUE_MISSING);
    if (userId !== episode.creatorsId)
      throw new Error(errorCode.PERMISSION_DENIED);

    deleteFile(episode.videoUrl);
    deleteFile(episode.displayPicture);

    episode.previewImagesUrl.forEach((value) => deleteFile(value));

    (await episode.remove()).save();
    await db.removeUsersVideoRef(userId, episodeId);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getMovieData = async (req: Request, res: Response) => {
  const { movieId } = req.params;

  try {
    const movie = await db.findMovieById(movieId);
    assertNonNullish(movie, errorCode.VALUE_MISSING);

    res.status(200).json(db.returnMovie(movie));
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getSeriesData = async (req: Request, res: Response) => {
  const { seriesId } = req.params;

  try {
    const series = await db.findSeriesById(seriesId);
    assertNonNullish(series, errorCode.VALUE_MISSING);

    res.status(200).json(db.returnSeries(series));
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getSeriesEpisodes = async (req: Request, res: Response) => {
  const { seriesId } = req.params;
  try {
    assertNonNullish(seriesId, errorCode.REQUEST_PARAMS_MISSING);
    const series = await db.findSeriesById(seriesId);
    assertNonNullish(series, errorCode.VALUE_MISSING);
    const episodes = await db.getSeriesEpisodes(series.episodes);
    assertIsNonEmptyArray(episodes, 'No episodes here');
    return res
      .status(200)
      .json(db.sortEpisodesArray(episodes, series.amountOfSessions));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'No episodes here') return res.status(200).json([]);
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getEpisodeData = async (req: Request, res: Response) => {
  const { episodeId } = req.params;

  try {
    const episode = await db.findEpisodeById(episodeId);
    assertNonNullish(episode, errorCode.VALUE_MISSING);

    res.status(200).json(db.returnEpisode(episode));
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

const getMyList = async (
  profileId: string,
  userId: string | Types.ObjectId
) => {
  try {
    const user = await db.findUserById(userId);
    assertNonNullish(user, errorCode.VALUE_MISSING);
    const activeProfile = user.profiles?.find(
      ({ _id }) => String(_id) === profileId
    );
    assertNonNullish(activeProfile, errorCode.VALUE_MISSING);
    if (!activeProfile.savedList) throw new Error(errorCode.VALUE_NOT_EXISTING);

    const movieList = await db.getMyListInMovie(activeProfile.savedList);
    const seriesList = await db.getMyListInSeries(activeProfile.savedList);
    let videoArray: returnVideosArray = [];
    const movieArray = db.returnMoviesArray(movieList) || [];
    if (movieArray.length) videoArray = videoArray.concat(movieArray);
    const seriesArray = db.returnSeriesArray(seriesList) || [];
    if (seriesArray.length) videoArray = videoArray.concat(seriesArray);
    return videoArray;
  } catch (error: any) {
    if (error) throw new Error(error.message || error);
  }
};

const getWatchAged = async (
  profileId: string,
  userId: string | Types.ObjectId
) => {
  try {
    const user = await db.findUserById(userId);
    assertNonNullish(user, errorCode.VALUE_MISSING);
    const activeProfile = user.profiles?.find(
      ({ _id }) => String(_id) === profileId
    );
    assertNonNullish(activeProfile, errorCode.VALUE_MISSING);
    if (!activeProfile.hasWatch) throw new Error(errorCode.VALUE_NOT_EXISTING);

    const movieList = await db.getWatchAgedInMovies(activeProfile.hasWatch);
    const seriesList = await db.getWatchAgedInSeries(activeProfile.hasWatch);
    return {
      movieList: db.returnMoviesArray(movieList) || [],
      seriesList: db.returnSeriesArray(seriesList) || [],
    };
  } catch (error: any) {
    return new Error(error.message || error);
  }
};

const getTop10Movies = async () => {
  try {
    const result = await db.getTop10Movies();
    assertNonNullish(result, errorCode.VALUE_MISSING);
    if (!result.length) throw new Error(errorCode.VALUE_NOT_EXISTING);
    return db.returnMoviesArray(result);
  } catch (error: any) {
    if (error) throw new Error(error.message || error);
  }
};

const getTop10Series = async () => {
  try {
    const result = await db.getTop10Series();
    assertNonNullish(result, errorCode.VALUE_MISSING);
    if (!result.length) throw new Error(errorCode.VALUE_NOT_EXISTING);
    return db.returnSeriesArray(result);
  } catch (error: any) {
    if (error) throw new Error(error.message || error);
  }
};

const getRandomMovie = async () => {
  try {
    const result = await db.randomMovie();
    assertNonNullish(result, errorCode.VALUE_MISSING);
    if (!result.length) throw new Error(errorCode.VALUE_NOT_EXISTING);
    return db.returnMoviesArray(result);
  } catch (error: any) {
    if (error) throw new Error(error.message || error);
  }
};

const getRandomSeries = async () => {
  try {
    const result = await db.randomSeries();
    assertNonNullish(result, errorCode.VALUE_MISSING);
    if (!result.length) throw new Error(errorCode.VALUE_NOT_EXISTING);
    return db.returnSeriesArray(result);
  } catch (error: any) {
    if (error) throw new Error(error.message || error);
  }
};

export const getVideosData = async (req: Request, res: Response) => {
  const {
    queryName,
    profileId,
  }: { queryName: queryPathsString; profileId?: string } = req.body;
  try {
    assertsQueryPaths(queryName, errorCode.WRONG_VALUE);
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }

  const {
    myList,
    continueWatching,
    watchAged,
    becauseYouWatch,
    becauseYouLiked,
    forYou,
    newlyAdded,
    popular,
    top10movies,
    top10series,
    randomMovie,
    randomSeries,
  } = queryPaths;
  // after this query combined categories

  const failedMsg = { message: 'route dose not exist', success: false };
  let resultData: unknown = null;
  try {
    if (queryName === myList && profileId)
      resultData = await getMyList(profileId, req.user._id);
    // if (queryName === continueWatching && profileId)
    //   resultData = await getContinueWatching(profileId, req.user);
    else if (queryName === watchAged && profileId)
      resultData = await getWatchAged(profileId, req.user._id);
    else if (queryName === top10movies) resultData = await getTop10Movies();
    else if (queryName === top10series) resultData = await getTop10Series();
    else if (queryName === randomMovie) resultData = await getRandomMovie();
    else if (queryName === randomSeries) resultData = await getRandomSeries();
    else return res.status(404).json(failedMsg);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
  res.status(200).json(resultData);
};

// videos watched -->
export const addToMoviesWatched = async (req: Request, res: Response) => {
  const {
    userId,
    profileId,
    data,
  }: {
    userId: string | Types.ObjectId;
    profileId: string | Types.ObjectId;
    data: {
      movieId: Types.ObjectId | string;
      trackId: number;
    };
  } = req.body;
  try {
    const response = await db.addToMoviesWatched(userId, profileId, data);
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const updateMoviesWatched = async (req: Request, res: Response) => {
  const {
    userId,
    profileId,
    movieId,
    trackId,
  }: {
    userId: string | Types.ObjectId;
    profileId: string | Types.ObjectId;
    movieId: string | Types.ObjectId;
    trackId: number;
  } = req.body;
  try {
    const response = await db.updateMoviesWatched(
      userId,
      profileId,
      movieId,
      trackId
    );
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const removeMovieWatched = async (req: Request, res: Response) => {
  const {
    userId,
    profileId,
    movieId,
  }: {
    userId: string | Types.ObjectId;
    profileId: string | Types.ObjectId;
    movieId: string | Types.ObjectId;
  } = req.body;
  try {
    const response = await db.removeMovieWatched(userId, profileId, movieId);
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const addToSeriesWatched = async (req: Request, res: Response) => {
  const {
    userId,
    profileId,
    data,
  }: {
    userId: string | Types.ObjectId;
    profileId: string | Types.ObjectId;
    data: {
      seriesId: Types.ObjectId | string;
      activeEpisode: {
        episodeId: Types.ObjectId | string;
        trackId: number;
      };
      watchedEpisodes: {
        episodeId: Types.ObjectId | string;
        trackId: number;
      }[];
    };
  } = req.body;
  try {
    const response = await db.addToSeriesWatched(userId, profileId, data);
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const removeEpisodeWatched = async (req: Request, res: Response) => {
  const {
    userId,
    profileId,
    seriesId,
  }: {
    userId: string | Types.ObjectId;
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
  } = req.body;
  try {
    const response = await db.removeEpisodeWatched(userId, profileId, seriesId);
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const setSeriesWatchedActiveEpisode = async (
  req: Request,
  res: Response
) => {
  const {
    userId,
    profileId,
    seriesId,
    activeEpisode,
  }: {
    userId: string | Types.ObjectId;
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
    activeEpisode: {
      episodeId: Types.ObjectId | string;
      trackId: number;
    };
  } = req.body;
  try {
    const response = await db.setSeriesWatchedActiveEpisode(
      userId,
      profileId,
      seriesId,
      activeEpisode
    );
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const updateSeriesWatchedActiveEpisode = async (
  req: Request,
  res: Response
) => {
  const {
    userId,
    profileId,
    seriesId,
    trackId,
  }: {
    userId: string | Types.ObjectId;
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
    trackId: number;
  } = req.body;
  try {
    const response = await db.updateSeriesWatchedActiveEpisode(
      userId,
      profileId,
      seriesId,
      trackId
    );
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const addToSeriesWatchedEpisodes = async (
  req: Request,
  res: Response
) => {
  const {
    userId,
    profileId,
    seriesId,
    data,
  }: {
    userId: string | Types.ObjectId;
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
    data: {
      episodeId: Types.ObjectId | string;
      trackId: number;
    };
  } = req.body;
  try {
    const response = await db.addToSeriesWatchedEpisodes(
      userId,
      profileId,
      seriesId,
      data
    );
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const updateSeriesWatchedEpisode = async (
  req: Request,
  res: Response
) => {
  const {
    userId,
    profileId,
    seriesId,
    episodeId,
    trackId,
  }: {
    userId: string | Types.ObjectId;
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
    episodeId: Types.ObjectId | string;
    trackId: number;
  } = req.body;
  try {
    const response = await db.updateSeriesWatchedEpisode(
      userId,
      profileId,
      seriesId,
      episodeId,
      trackId
    );
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};
// end of videos watched -->

export const getMoviesDataByCategory = async (req: Request, res: Response) => {
  const {
    categoryNames,
    exudeArray,
  }: { categoryNames: string[]; exudeArray?: string[] } = req.body;

  try {
    const videosFromCategory = await db.randomMovieByCategory(
      categoryNames,
      exudeArray ? exudeArray : undefined
    );
    assertIsNonEmptyArray(videosFromCategory, errorCode.VALUE_MISSING);

    res.status(200).json(db.returnMoviesArray(videosFromCategory));
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getSeriesDataByCategory = async (req: Request, res: Response) => {
  const {
    categoryNames,
    exudeArray,
  }: { categoryNames: string[]; exudeArray: string[] } = req.body;

  try {
    const videosFromCategory = await db.randomSeriesByCategory(
      categoryNames,
      exudeArray
    );
    assertIsNonEmptyArray(videosFromCategory, errorCode.VALUE_MISSING);

    res.status(200).json(db.returnSeriesArray(videosFromCategory));
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getSearchData = async (req: Request, res: Response) => {
  const { value } = req.query;
  try {
    assertsIsString(value);
    const movies = await db.searchForMovies(value);
    const series = await db.searchForSeries(value);

    const valueArray: returnVideosArray = db
      .returnMoviesArray(movies)
      .concat(db.returnSeriesArray(series));

    res.status(200).json(shuffleArray(valueArray));
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getSearchMovieData = async (req: Request, res: Response) => {
  const { value } = req.query;
  try {
    assertsIsString(value);
    const movies = await db.searchForMovies(value);

    res.status(200).json(db.returnMoviesArray(movies) || undefined);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getSearchSeresData = async (req: Request, res: Response) => {
  const { value } = req.query;
  try {
    assertsIsString(value);
    const series = await db.searchForSeries(value);

    res.status(200).json(db.returnSeriesArray(series) || undefined);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const addIdToSavedList = async (req: Request, res: Response) => {
  const { profileId, videoId }: { profileId: string; videoId: string } =
    req.body;

  try {
    const user = await db.findUserById(req.user._id);
    assertNonNullish(user, errorCode.NOT_AUTHENTICATED);
    const valueInList = user.profiles
      ?.find(({ _id }) => String(_id) === profileId)
      ?.savedList?.find((v) => String(v) === videoId);
    assertUndefined(valueInList, errorCode.VALUE_EXISTS);

    const result = await db.addIdToSavedList(req.user._id, profileId, videoId);

    res.status(200).json({ success: result.acknowledged });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const removeIdFromSavedList = async (req: Request, res: Response) => {
  const { profileId, videoId }: { profileId: string; videoId: string } =
    req.body;

  try {
    const result = await db.removeIdFromSavedList(
      req.user._id,
      profileId,
      videoId
    );

    res.status(200).json({ success: result.acknowledged });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

// genera purpose for fixing things
// export const fix = async (_req: Request, res: Response) => {
//   const episodes = await episodesSchema.find();
//   assertIsNonEmptyArray(episodes, 'error in this thing');

//   for (let index = 0; index < episodes.length; index++) {
//     const episode = episodes[index];

//     const duration = await getVideoDurationInSeconds(episode.videoUrl);
//     const response = await episode.updateOne({
//       $set: { durationInMs: duration },
//     });
//     console.log(response);
//   }

//   res.status(200).json({ success: true });
// };

export const generateFFmpegToMovie = async (req: Request, res: Response) => {
  const { movieId } = req.params;
  try {
    const video = await db.findMovieById(movieId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    const cleanedString = cleanString(video.title);

    const previewImageArray = await generatePreviewImages({
      videoUrl: video.videoUrl,
      outputPathAndFileName: `uploads/images/ffmpeg/${Date.now()}-${cleanedString}`, // no increment or extension
      fps: 1 / 10,
      resolution: '1080x720',
    });

    const response = await db.updateMoviePreviewImages(
      video._id,
      previewImageArray
    );

    res.status(200).json({ success: response.acknowledged });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    } else console.log(error);
  }
};

export const generateFFmpegToEpisode = async (req: Request, res: Response) => {
  const { episodeId } = req.params;
  try {
    const video = await db.findEpisodeById(episodeId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    const cleanedString = cleanString(
      `${video.seriesTitle}${video.episodeTitle}`
    );

    const previewImageArray = await generatePreviewImages({
      videoUrl: video.videoUrl,
      outputPathAndFileName: `uploads/images/ffmpeg/${Date.now()}-${cleanedString}`, // no increment or extension
      fps: 1 / 10,
      resolution: '1080x720',
    });

    const response = await db.updateEpisodesPreviewImages(
      video._id,
      previewImageArray
    );

    res.status(200).json({ success: response.acknowledged });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    } else console.log(error);
  }
};

export const removeFFmpegFromMovie = async (req: Request, res: Response) => {
  const { movieId } = req.params;
  try {
    const video = await db.findMovieById(movieId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    if (!video.previewImagesUrl.length)
      throw new Error(errorCode.VALUE_NOT_EXISTING);

    one: for (let index = 0; index < video.previewImagesUrl.length; index++) {
      if (!fs.existsSync(video.previewImagesUrl[index])) continue one;
      fs.unlinkSync(video.previewImagesUrl[index]);
    }
    const response = await db.deleteMoviePreviewImages(video._id);

    res.status(200).json({ success: response.acknowledged });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    } else console.log(error);
  }
};

export const removeFFmpegFromEpisode = async (req: Request, res: Response) => {
  const { episodeId } = req.params;
  try {
    const video = await db.findEpisodeById(episodeId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    if (!video.previewImagesUrl.length)
      throw new Error(errorCode.VALUE_NOT_EXISTING);

    one: for (let index = 0; index < video.previewImagesUrl.length; index++) {
      if (!fs.existsSync(video.previewImagesUrl[index])) continue one;
      fs.unlinkSync(video.previewImagesUrl[index]);
    }
    const response = await db.deleteEpisodePreviewImages(video._id);

    res.status(200).json({ success: response.acknowledged });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    } else console.log(error);
  }
};

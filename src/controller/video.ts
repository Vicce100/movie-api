import { Request, Response } from 'express';
import fs from 'fs';

import movieSchema from '../schemas/movieSchema.js';
import db from '../utilities/db/index.js';
import {
  errorCode,
  mp4,
  url,
  queryPaths,
  UserType,
  queryPathsString,
  MovieSchemaType,
  SeriesSchemaType,
} from '../utilities/types.js';
import {
  assertNonNullish,
  assertIsNonEmptyArray,
  assertsValueToType,
  assertsQueryPaths,
  assertsIsString,
} from '../utilities/assertions.js';
import { errorHandler } from '../utilities/middleware.js';
import { cleanString, generatePreviewImages } from '../utilities/index.js';
import { Types } from 'mongoose';
import seriesSchema from '../schemas/seriesSchema.js';
import episodesSchema from '../schemas/episodesSchema.js';

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
  } catch (error) {
    console.log(error);
  }
  res.status(200).json({ success: true });
};

export const uploadMovie = async (req: Request, res: Response) => {
  const { files } = req;
  const {
    title,
    description,
    categories,
    releaseDate,
    isPublic,
  }: {
    title: string;
    description: string;
    categories: string[] | string;
    releaseDate: string;
    isPublic?: boolean;
  } = req.body;

  if (!files || !categories || !title)
    return res.status(404).json('wrong filled value was uploaded!');

  if (!Array.isArray(files)) {
    let tempCategory: string[] | null = null;
    if (Array.isArray(categories))
      tempCategory = categories.map((tempCategory) => tempCategory);
    else tempCategory = [categories];

    try {
      const newMovie = new movieSchema({
        title,
        videoUrl: files.videoFile[0].path,
        displayPicture: files.displayPicture[0].path,
        previewImagesUrl: [],
        // album: files.album.map((file) => file.path) || [],
        categories: tempCategory,
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
    seriesTitle,
    seriesId,
    episodeTitle,
    description,
    releaseDate,
    sessionNr,
    episodeNr,
  }: {
    seriesTitle: string;
    seriesId: string;
    episodeTitle: string;
    description: string;
    releaseDate: string;
    sessionNr: number;
    episodeNr: number;
  } = req.body;
  assertNonNullish(files, errorCode.WRONG_VALUE);

  try {
    if (Array.isArray(files)) throw new Error(errorCode.WRONG_VALUE);

    const series = new episodesSchema({
      seriesTitle,
      episodeTitle,
      seriesId,
      videoUrl: files.videoFile[0].path,
      displayPicture: files.displayPicture[0].path,
      previewImagesUrl: [],
      views: 0,
      description,
      releaseDate,
      sessionNr,
      episodeNr,
      creatorsId: req.user._id,
    });

    await series.save();

    res.status(201).json({ success: true });

    const previewImageArray = await generatePreviewImages({
      videoUrl: series.videoUrl,
      outputPathAndFileName: `uploads/images/ffmpeg/${cleanString(
        series.episodeTitle
      )}`, // no increment or extension
      fps: 1 / 10,
      resolution: '1920x1080',
    });

    await db.updateEpisodesPreviewImages(series._id, previewImageArray);
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

    (await movie.remove()).save();
    await db.removeUsersVideoRef(req.user._id, movieId);
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
    const movie = await db.findEpisodeById(episodeId);
    assertNonNullish(movie, errorCode.VALUE_MISSING);
    if (userId !== movie.creatorsId)
      throw new Error(errorCode.PERMISSION_DENIED);

    (await movie.remove()).save();
    await db.removeUsersVideoRef(req.user._id, episodeId);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getSingleMovieData = async (req: Request, res: Response) => {
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

export const getSingleEpisodeData = async (req: Request, res: Response) => {
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

const getMyList = async (profileId: string, user: UserType) => {
  try {
    assertsValueToType<Types.ObjectId>(profileId);
    const activeProfile = user.profiles?.find(({ _id }) => _id === profileId);
    assertNonNullish(activeProfile, errorCode.VALUE_MISSING);
    if (!activeProfile.savedList) throw new Error(errorCode.VALUE_NOT_EXISTING);

    const movieList = await db.getMyListInMovie(activeProfile.savedList);
    const seriesList = await db.getMyListInSeries(activeProfile.savedList);
    return {
      movieList: db.returnMoviesArray(movieList) || [],
      seriesList: db.returnSeriesArray(seriesList) || [],
    };
  } catch (error: any) {
    if (error) throw new Error(error.message || error);
  }
};

const getWatchAged = async (profileId: string, user: UserType) => {
  try {
    assertsValueToType<Types.ObjectId>(profileId);
    const activeProfile = user.profiles?.find(({ _id }) => _id === profileId);
    assertNonNullish(activeProfile, errorCode.VALUE_MISSING);
    if (!activeProfile.hasWatch) throw new Error(errorCode.VALUE_NOT_EXISTING);

    const movieList = await db.getWatchAgedInMovies(activeProfile.hasWatch);
    const seriesList = await db.getWatchAgedInSeries(activeProfile.hasWatch);
    return {
      movieList: db.returnMoviesArray(movieList) || [],
      seriesList: db.returnSeriesArray(seriesList) || [],
    };
  } catch (error) {}
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

// categories to query
/*
Romantic movies
Family movies
Comedy + Crime series
Teen + Comedy movies and series
Action movie
Documentary // should only be series
History movies
*/

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
      resultData = await getMyList(profileId, req.user);
    else if (queryName === watchAged && profileId)
      resultData = await getWatchAged(profileId, req.user);
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

export const getMoviesDataByCategory = async (req: Request, res: Response) => {
  const { categoryNames }: { categoryNames: string[] } = req.body;

  try {
    let videosFromCategory = await db.randomMovieByCategory(categoryNames);
    assertIsNonEmptyArray(videosFromCategory, errorCode.VALUE_MISSING);

    res.status(200).json(
      videosFromCategory.map(({ _id, title, displayPicture }) => ({
        _id,
        title,
        displayPicture: `${url}/${displayPicture}`,
      }))
    );
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getSeriesDataByCategory = async (req: Request, res: Response) => {
  const { categoryNames }: { categoryNames: string[] } = req.body;

  try {
    let videosFromCategory = await db.randomSeriesByCategory(categoryNames);
    assertIsNonEmptyArray(videosFromCategory, errorCode.VALUE_MISSING);

    res.status(200).json(
      videosFromCategory.map(({ _id, title, displayPicture }) => ({
        _id,
        title,
        displayPicture: `${url}/${displayPicture}`,
      }))
    );
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getSearchData = async (req: Request, res: Response) => {
  const { value } = req.query;
  console.log(value);
  try {
    assertsIsString(value);
    const movies = await db.searchForMovies(value);
    const series = await db.searchForSeries(value);

    res.status(200).json({
      movies: db.returnMoviesArray(movies) || [],
      series: db.returnSeriesArray(series) || [],
    });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

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

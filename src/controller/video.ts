'use strict';

import { Request, Response } from 'express';
import fs from 'fs';
import { getVideoDurationInSeconds } from 'get-video-duration';

import movieSchema from '../schemas/movieSchema.js';
import seriesSchema from '../schemas/seriesSchema.js';
import episodesSchema from '../schemas/episodeSchema.js';
import db, { querySize } from '../utilities/db/index.js';
import {
  continueWatchingType,
  EpisodeSchemaType,
  errorCode,
  MovieSchemaType,
  mp4,
  ProfileType,
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
  assertsToNonNullable,
  assertsIsNumber,
} from '../utilities/assertions.js';
import { errorHandler } from '../utilities/middleware.js';
import {
  cleanString,
  deleteFile,
  generatePreviewImages,
  shuffleArray,
  downloadFile,
  slashesForOs,
  getUniqueArray,
} from '../utilities/index.js';
import { Types } from 'mongoose';
import { url } from '../../app.js';
import profilesSchema from '../schemas/profilesSchema.js';

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

export const getVideo = async (req: Request, res: Response) => {
  const { range } = req.headers;
  const { id } = req.params;
  const { T } = req.query;

  // on Ubuntu 20.04 the if statement will get trigger on the first request even
  // if range header is set to "bytes=0-"
  // if (!range) return res.status(404).send('Missing Requires Range header! ');

  try {
    let tempVideo: any = null;

    if (T === 'M') tempVideo = await db.findMovieById(id);
    else if (T === 'E') tempVideo = await db.findEpisodeById(id);

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
    creditsDurationInMs,
    isPublic,
    displayPictureUrl,
    backdropPath,
  }: {
    title: string;
    description: string;
    categories: string[] | string;
    franchise: string[] | string;
    releaseDate: string;
    creditsDurationInMs: number;
    isPublic?: boolean;
    displayPictureUrl: string;
    backdropPath: string;
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

    const displayPictureValue = await downloadFile({
      filepath: 'uploads/images/public/',
      url: displayPictureUrl,
    });
    const backdropPathValue = await downloadFile({
      filepath: 'uploads/images/public/',
      url: backdropPath,
    });

    try {
      const newMovie = new movieSchema({
        title,
        videoUrl: files.videoFile[0].path,
        displayPicture: displayPictureValue.fullPath,
        backdropPath: backdropPathValue.fullPath,
        previewImagesUrl: [],
        durationInMs: duration * 1000,
        creditsDurationInMs: creditsDurationInMs ? creditsDurationInMs : 480000, // 480.000 ms = 8 min
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
        outputPath: `uploads/images/ffmpeg/`,
        fileName: cleanString(title), // no increment or extension
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

export const uploadMovieFile = async (req: Request, res: Response) => {
  const { name, currentChunkIndex, totalChunks, movieId } = req.query;

  const firstChunk = parseInt(currentChunkIndex as string) === 0;
  const lastChunk =
    parseInt(currentChunkIndex as string) ===
    parseInt(totalChunks as string) - 1;

  assertsIsString(name);

  const filepath = slashesForOs('uploads/videos/public/');

  const ext = name.split('.').pop();
  const [data, tmpFilename, finalFilename, path] = [
    req.body.toString().split(',')[1] as string,
    `Temp_${cleanString(name)}.${ext}`,
    `${Date.now()}-${cleanString(name)}.${ext}`,
    filepath || 'uploads/videos/public/',
  ];

  const buffer = Buffer.from(data, 'base64');

  if (firstChunk && fs.existsSync(path + tmpFilename))
    fs.unlinkSync(path + tmpFilename);
  fs.appendFileSync(path + tmpFilename, buffer);

  if (!lastChunk) res.status(202).send('ok');
  else {
    fs.renameSync(path + tmpFilename, path + finalFilename);

    const duration = await getVideoDurationInSeconds(path + finalFilename);

    movieSchema
      .updateOne(
        { _id: movieId },
        {
          $set: {
            videoUrl: slashesForOs(path + finalFilename),
            durationInMs: duration * 1000,
          },
        }
      )
      .catch((err) => console.log(err));

    res.status(200).send({ success: true, movieId });
  }
};

/**
 * Main Upload Function (Using Chunks "uploadMovieFile" After Creating Movie Object)
 */
export const uploadMovieObject = async (req: Request, res: Response) => {
  const {
    title,
    description,
    categories,
    franchise,
    releaseDate,
    creditsDurationInMs,
    isPublic,
    displayPictureUrl,
    backdropPath,
  }: {
    title: string;
    description: string;
    categories: string[] | string;
    franchise: string[] | string;
    releaseDate: string;
    creditsDurationInMs: number;
    isPublic?: boolean;
    displayPictureUrl: string;
    backdropPath: string;
  } = req.body;

  if (!categories || !title)
    return res.status(404).json('wrong filled value was uploaded!');

  let tempCategory: string[] | null = null;
  let tempFranchises: string[] | null = null;

  if (!Array.isArray(categories)) tempCategory = [categories];
  else tempCategory = categories.map((tempCategory) => tempCategory);
  if (!Array.isArray(franchise)) tempFranchises = [franchise];
  else tempFranchises = franchise.map((tempFranchise) => tempFranchise);

  const displayPictureValue = await downloadFile({
    filepath: 'uploads/images/public/',
    url: displayPictureUrl,
  });
  const backdropPathValue = await downloadFile({
    filepath: 'uploads/images/public/',
    url: backdropPath,
  });

  try {
    const newMovie = new movieSchema({
      title,
      videoUrl: '',
      displayPicture: slashesForOs(displayPictureValue.fullPath),
      backdropPath: slashesForOs(backdropPathValue.fullPath),
      previewImagesUrl: [],
      durationInMs: 0,
      creditsDurationInMs: creditsDurationInMs ? creditsDurationInMs : 480000, // 480.000 ms = 8 min
      categories: tempCategory,
      franchise: tempFranchises,
      description,
      creatorsId: req.user._id,
      releaseDate,
      public: isPublic || true,
      views: 0,
    });
    const { _id } = newMovie;
    await newMovie.save();
    await db.addUsersMovie(req.user._id, _id);

    res.status(201).json({ success: true, movieId: _id });
  } catch (error) {
    console.log(error);
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
      outputPath: `uploads/images/ffmpeg/`,
      fileName: cleanString(episode.episodeTitle), // no increment or extension
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

  try {
    const movie = await movieSchema.findOne({ _id: movieId }).exec();
    assertNonNullish(movie, errorCode.VALUE_MISSING);

    if (movie.videoUrl) deleteFile(movie.videoUrl);
    if (movie.displayPicture) deleteFile(movie.displayPicture);
    if (movie.backdropPath) deleteFile(movie.backdropPath);

    for (let index = 0; index < movie.previewImagesUrl.length; index++) {
      deleteFile(movie.previewImagesUrl[index]);
    }

    (await movie.remove()).save();
    // await db.removeUsersVideoRef(req.user._id, movieId);

    await db.removeAllIdFromLikedList(movieId);
    await db.removeAllIdFromSavedList(movieId);

    const video = await db.findMovieById(movieId);
    if (video)
      video.categories.forEach(
        async (categoryName) =>
          await db.removeAllFromForYouCategoryList(categoryName)
      );

    res.status(204).json({ success: true });
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

export const updateMovie = async (req: Request, res: Response) => {
  const {
    title,
    creditsDurationInMs,
    isPublic,
    categories,
    franchise,
    description,
    releaseDate,
    displayPictureUrl,
    backdropPath,
    videoId,
  }: {
    title: String;
    creditsDurationInMs: number;
    isPublic: boolean;
    categories: String[];
    franchise: String[];
    description: String;
    releaseDate: String;
    displayPictureUrl: string;
    backdropPath: string;
    videoId: string;
  } = req.body;

  const fieldsTOUpdate: any = {};

  if (title) fieldsTOUpdate.title = title;
  if (creditsDurationInMs)
    fieldsTOUpdate.creditsDurationInMs = creditsDurationInMs;
  fieldsTOUpdate.isPublic = isPublic;
  if (categories && categories.length) fieldsTOUpdate.categories = categories;
  if (franchise && franchise.length) fieldsTOUpdate.franchise = franchise;
  if (description) fieldsTOUpdate.description = description;
  if (releaseDate) fieldsTOUpdate.releaseDate = releaseDate;

  try {
    const movie = await db.findMovieById(videoId);
    assertNonNullish(movie, errorCode.EMPTY_VALUE);

    if (displayPictureUrl) {
      if (movie && movie.displayPicture) deleteFile(movie.displayPicture);

      const displayPictureValue = await downloadFile({
        filepath: 'uploads/images/public/',
        url: displayPictureUrl,
      });
      fieldsTOUpdate.displayPicture = displayPictureValue.fullPath;
    }
    if (backdropPath) {
      if (movie && movie.backdropPath) deleteFile(movie.backdropPath);

      const backdropPathValue = await downloadFile({
        filepath: 'uploads/images/public/',
        url: backdropPath,
      });
      fieldsTOUpdate.backdropPath = backdropPathValue.fullPath;
    }

    await movieSchema.findOneAndUpdate(
      { _id: videoId },
      { $set: fieldsTOUpdate },
      { new: true }
    );

    res.status(204).json({ success: true });
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

const getMyList = async (profileId: string) => {
  try {
    const activeProfile = await db.findProfileById(profileId);
    assertNonNullish(activeProfile, errorCode.VALUE_MISSING);

    if (!activeProfile.savedList) throw new Error(errorCode.VALUE_NOT_EXISTING);

    const [movieList, seriesList] = await Promise.all([
      db.getMovieByIds(activeProfile.savedList),
      db.getSeriesByIds(activeProfile.savedList),
    ]);

    let tempVideoArray: returnVideosArray = [];
    tempVideoArray = tempVideoArray.concat(db.returnMoviesArray(movieList));
    tempVideoArray = tempVideoArray.concat(db.returnSeriesArray(seriesList));

    const videoArray: returnVideosArray = activeProfile.savedList
      .map((saved) =>
        tempVideoArray.find(({ _id }) => String(_id) === String(saved))
      )
      .flatMap((val) => (typeof val !== 'undefined' ? val : []));

    return videoArray;
  } catch (error: any) {
    if (error) throw new Error(error.message || error);
  }
};

const getContinueWatching = async (profileId: string) => {
  try {
    const activeProfile = await db.findProfileById(profileId);
    assertNonNullish(activeProfile, errorCode.VALUE_MISSING);

    if (!activeProfile.isWatchingMovie || !activeProfile.isWatchingSeries)
      throw new Error(errorCode.VALUE_NOT_EXISTING);

    let videoArray: continueWatchingType[] = [];

    const promiseMoviesArray = activeProfile.isWatchingMovie
      .map(async ({ movieId, trackId }) => {
        const activeMovie = await db.findMovieById(movieId);
        if (!activeMovie) return;
        return {
          _id: movieId,
          title: activeMovie.title,
          episodeTitle: null,
          episodeId: null,
          sessionNr: null,
          episodeNr: null,
          trackId: trackId,
          duration: activeMovie.durationInMs,
          isMovie: true,
          displayPicture: `${url}/${activeMovie.displayPicture}`,
          episodeDisplayPicture: null,
        };
      })
      .flatMap((val) => (typeof val !== 'undefined' ? val : []));

    for (let index = 0; index < promiseMoviesArray.length; index++) {
      const element = await promiseMoviesArray[index];
      if (element) videoArray.push(element);
    }

    const promiseSeriesArray = activeProfile.isWatchingSeries
      .map(
        async ({
          seriesId,
          activeEpisode,
        }): Promise<continueWatchingType | undefined> => {
          const [activeSeries, currentEpisode] = await Promise.all([
            db.findSeriesById(seriesId),
            db.findEpisodeById(activeEpisode.episodeId),
          ]);

          if (!activeSeries || !currentEpisode) return undefined;

          return {
            _id: seriesId,
            episodeId: currentEpisode._id,
            title: activeSeries.title,
            episodeTitle: currentEpisode.episodeTitle,
            sessionNr: currentEpisode.seasonNr,
            episodeNr: currentEpisode.episodeNr,
            trackId: activeEpisode.trackId,
            duration: currentEpisode.durationInMs,
            isMovie: false,
            displayPicture: `${url}/${activeSeries.displayPicture}`,
            episodeDisplayPicture: `${url}/${currentEpisode.displayPicture}`,
          };
        }
      )
      .flatMap((val) => (typeof val !== 'undefined' ? val : []));

    for (let index = 0; index < promiseSeriesArray.length; index++) {
      const element = await promiseSeriesArray[index];
      if (element) videoArray.push(element);
    }

    return videoArray;
  } catch (error: any) {
    if (error) throw new Error(error.message || error);
  }
};

const getWatchAged = async (profileId: string) => {
  try {
    const activeProfile = await db.findProfileById(profileId);
    assertNonNullish(activeProfile, errorCode.VALUE_MISSING);

    if (!activeProfile.hasWatch) throw new Error(errorCode.VALUE_NOT_EXISTING);

    const [movieList, seriesList] = await Promise.all([
      db.getWatchAgedInMovies(activeProfile.hasWatch),
      db.getWatchAgedInSeries(activeProfile.hasWatch),
    ]);

    return {
      movieList: db.returnMoviesArray(movieList) || [],
      seriesList: db.returnSeriesArray(seriesList) || [],
    };
  } catch (error: any) {
    return new Error(error.message || error);
  }
};

const getForYou = async (profileId: string) => {
  try {
    const activeProfile = await db.findProfileById(profileId);
    assertNonNullish(activeProfile, errorCode.VALUE_MISSING);
    const { forYouCategoryList } = activeProfile;

    let totalCategoriesAmount: number = 0;
    forYouCategoryList.map(
      ({ amount }) => (totalCategoriesAmount = totalCategoriesAmount + amount)
    );

    assertsIsNumber(totalCategoriesAmount);

    const ArrayToQuery = forYouCategoryList.map(({ amount, categoryName }) => ({
      categoryName,
      amount: Math.round((amount / totalCategoriesAmount) * querySize),
    }));

    const queryResult: MovieSchemaType[] = [];

    for (let index = 0; index < ArrayToQuery.length; index++) {
      const { amount, categoryName } = ArrayToQuery[index];
      const videosFromCategory = await db.randomMovieByCategory(
        [categoryName], // search array
        undefined, // excludeArray or undefined if no exclusions
        amount
      );
      videosFromCategory.forEach((movie) => queryResult.push(movie));
    }

    return db.returnMoviesArray(getUniqueArray(queryResult));
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
  }
};

const getNewlyAdded = async () => {
  try {
    const [movieList, seriesList] = await Promise.all([
      db.getNewlyAddedMovies(),
      db.getNewlyAddedSeries(),
    ]);

    let videoArray: returnVideosArray = db
      .returnMoviesArray(movieList)
      .concat(db.returnSeriesArray(seriesList));

    return videoArray;
  } catch (error: any) {
    if (error) throw new Error(error.message || error);
  }
};

const getTop54Movies = async () => {
  try {
    const result = await db.getTop54Movies();
    assertNonNullish(result, errorCode.VALUE_MISSING);
    if (!result.length) throw new Error(errorCode.VALUE_NOT_EXISTING);
    return db.returnMoviesArray(result);
  } catch (error: any) {
    if (error) throw new Error(error.message || error);
  }
};

const getTop54Series = async () => {
  try {
    const result = await db.getTop54Series();
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
    top54movies,
    top54series,
    randomMovie,
    randomSeries,
  } = queryPaths;
  // after this query combined categories

  const failedMsg = {
    message: `route dose not exist at path ${queryName}`,
    success: false,
  };
  let resultData: unknown = null;

  try {
    if (queryName === myList && profileId)
      resultData = await getMyList(profileId);
    else if (queryName === continueWatching && profileId)
      resultData = await getContinueWatching(profileId);
    else if (queryName === watchAged && profileId)
      resultData = await getWatchAged(profileId);
    else if (queryName === forYou && profileId)
      resultData = await getForYou(profileId);
    else if (queryName === newlyAdded) resultData = await getNewlyAdded();
    else if (queryName === top54movies) resultData = await getTop54Movies();
    else if (queryName === top54series) resultData = await getTop54Series();
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

export const nuke = async (req: Request, res: Response) => {
  try {
    const allMovies = await movieSchema.find();
    const allSeries = await seriesSchema.find();
    const allEpisodes = await episodesSchema.find();

    for (let index = 0; index < allMovies.length; index++) {
      const { videoUrl, displayPicture, backdropPath } = allMovies[index];

      if (fs.existsSync(videoUrl)) fs.rmSync(videoUrl);
      if (fs.existsSync(displayPicture)) fs.rmSync(displayPicture);
      if (fs.existsSync(backdropPath)) fs.rmSync(backdropPath);
    }

    for (let index = 0; index < allSeries.length; index++) {
      const { displayPicture } = allSeries[index];

      if (fs.existsSync(displayPicture)) fs.rmSync(displayPicture);
    }

    for (let index = 0; index < allEpisodes.length; index++) {
      const { videoUrl, displayPicture } = allEpisodes[index];

      if (fs.existsSync(videoUrl)) fs.rmSync(videoUrl);
      if (fs.existsSync(displayPicture)) fs.rmSync(displayPicture);
    }
  } catch (error: any) {
    console.log(error);
    return res.status(400 || error.status).json(error.message);
  }
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
    const response = await db.addToMoviesWatched(profileId, data);
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const updateMoviesWatched = async (req: Request, res: Response) => {
  const {
    profileId,
    movieId,
    trackId,
  }: {
    profileId: string | Types.ObjectId;
    movieId: string | Types.ObjectId;
    trackId: number;
  } = req.body;
  try {
    const response = await db.updateMoviesWatched(profileId, movieId, trackId);
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const removeMovieWatched = async (req: Request, res: Response) => {
  const {
    profileId,
    movieId,
  }: {
    profileId: string | Types.ObjectId;
    movieId: string | Types.ObjectId;
  } = req.body;
  try {
    const response = await db.removeMovieWatched(profileId, movieId);
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const addToSeriesWatched = async (req: Request, res: Response) => {
  const {
    profileId,
    data,
  }: {
    profileId: string | Types.ObjectId;
    data: ProfileType;
  } = req.body;
  try {
    const response = await db.addToSeriesWatched(profileId, data);
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const removeSeriesWatched = async (req: Request, res: Response) => {
  const {
    profileId,
    seriesId,
  }: {
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
  } = req.body;
  try {
    const response = await db.removeSeriesWatched(profileId, seriesId);
    return res.status(200).send({ success: response.acknowledged });
  } catch (error: any) {
    const errorResponse = errorHandler(error);
    return res.status(Number(errorResponse.status)).json(errorResponse);
  }
};

export const removeEpisodeWatched = async (req: Request, res: Response) => {
  const {
    profileId,
    seriesId,
  }: {
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
  } = req.body;
  try {
    const response = await db.removeEpisodeWatched(profileId, seriesId);
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
    profileId,
    seriesId,
    activeEpisode,
  }: {
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
    activeEpisode: {
      episodeId: Types.ObjectId | string;
      trackId: number;
    };
  } = req.body;
  try {
    const response = await db.setSeriesWatchedActiveEpisode(
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
    profileId,
    seriesId,
    trackId,
  }: {
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
    trackId: number;
  } = req.body;
  try {
    const response = await db.updateSeriesWatchedActiveEpisode(
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
    profileId,
    seriesId,
    data,
  }: {
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
    data: {
      episodeId: Types.ObjectId | string;
      trackId: number;
    };
  } = req.body;
  try {
    const response = await db.addToSeriesWatchedEpisodes(
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
    profileId,
    seriesId,
    episodeId,
    trackId,
  }: {
    profileId: string | Types.ObjectId;
    seriesId: Types.ObjectId | string;
    episodeId: Types.ObjectId | string;
    trackId: number;
  } = req.body;
  try {
    const response = await db.updateSeriesWatchedEpisode(
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
    limit,
  }: { categoryNames: string[]; exudeArray?: string[]; limit?: number } =
    req.body;

  try {
    const videosFromCategory = await db.randomMovieByCategory(
      categoryNames,
      exudeArray,
      limit
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
    limit,
  }: { categoryNames: string[]; exudeArray: string[]; limit?: number } =
    req.body;

  try {
    const videosFromCategory = await db.randomSeriesByCategory(
      categoryNames,
      exudeArray,
      limit
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
    const profile = await db.findProfileById(profileId);
    assertNonNullish(profile, errorCode.VALUE_MISSING);

    const valueInList = profile.savedList?.find((v) => String(v) === videoId);
    assertUndefined(valueInList, errorCode.VALUE_EXISTS);

    const result = await db.addIdToSavedList(profileId, videoId);

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
    const result = await db.removeIdFromSavedList(profileId, videoId);

    res.status(200).json({ success: result.acknowledged });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

const ForYouCategoryList = async (
  profileId: string,
  videoId: string,
  action: 'increment' | 'decrement'
) => {
  try {
    const video = await db.findMovieById(videoId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    video.categories.forEach(async (categoryName) => {
      if (action === 'increment')
        await db.addToForYouCategoryList(profileId, categoryName);
      if (action === 'decrement')
        await db.removeFromForYouCategoryList(profileId, categoryName);
    });

    return { message: 'success', status: '200' };
  } catch (error) {
    if (error instanceof Error) {
      return errorHandler(error);
    }
  }
};

export const addIdToLikedList = async (req: Request, res: Response) => {
  const { profileId, videoId }: { profileId: string; videoId: string } =
    req.body;

  try {
    const profile = await db.findProfileById(profileId);
    assertNonNullish(profile, errorCode.VALUE_MISSING);

    const valueInList = profile.likedList?.find((v) => String(v) === videoId);
    assertUndefined(valueInList, errorCode.VALUE_EXISTS);

    const result = await db.addIdToLikedList(profileId, videoId);
    await ForYouCategoryList(profileId, videoId, 'increment');

    res.status(200).json({ success: result.acknowledged });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const removeIdFromLikedList = async (req: Request, res: Response) => {
  const { profileId, videoId }: { profileId: string; videoId: string } =
    req.body;

  try {
    const result = await db.removeIdFromLikedList(profileId, videoId);
    await ForYouCategoryList(profileId, videoId, 'decrement');

    res.status(200).json({ success: result.acknowledged });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getMoviesInfinityScroll = async (req: Request, res: Response) => {
  const { skip, limit } = req.query;

  try {
    assertNonNullish(Number(skip), errorCode.VALUE_MISSING);

    const movies = await db.getMoviesInfinityScroll(
      Number(skip) * Number(limit),
      limit !== null ? Number(limit) : undefined
    );
    assertNonNullish(movies, errorCode.VALUE_MISSING);

    return res.status(200).json(db.returnMoviesArray(movies));
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      return errorHandler(error);
    }
  }
};

export const getSeriesInfinityScroll = async (req: Request, res: Response) => {
  const { skip, limit } = req.query;

  try {
    assertNonNullish(skip, errorCode.VALUE_MISSING);

    const series = await db.getSeriesInfinityScroll(
      Number(skip) * Number(limit),
      limit !== null ? Number(limit) : undefined
    );
    assertNonNullish(series, errorCode.VALUE_MISSING);

    return res.status(200).json(db.returnSeriesArray(series));
  } catch (error) {
    if (error instanceof Error) {
      return errorHandler(error);
    }
  }
};

export const searchMoviesInfinityScroll = async (
  req: Request,
  res: Response
) => {
  const { skip, limit } = req.query;
  const { searchId } = req.params;

  try {
    assertNonNullish(skip, errorCode.VALUE_MISSING);

    const movies = await db.searchMoviesInfinityScroll(
      searchId,
      Number(skip) * Number(limit),
      limit !== null ? Number(limit) : undefined
    );
    assertNonNullish(movies, errorCode.VALUE_MISSING);

    return res.status(200).json(db.returnMoviesArray(movies));
  } catch (error) {
    if (error instanceof Error) {
      return errorHandler(error);
    }
  }
};

export const searchSeriesInfinityScroll = async (
  req: Request,
  res: Response
) => {
  const { skip, limit } = req.query;
  const { searchId } = req.params;

  try {
    assertNonNullish(skip, errorCode.VALUE_MISSING);

    const series = await db.searchSeriesInfinityScroll(
      searchId,
      Number(skip) * Number(limit),
      limit !== null ? Number(limit) : undefined
    );
    assertNonNullish(series, errorCode.VALUE_MISSING);

    return res.status(200).json(db.returnSeriesArray(series));
  } catch (error) {
    if (error instanceof Error) {
      return errorHandler(error);
    }
  }
};

// genera purpose for fixing things
export const fix = async (_req: Request, res: Response) => {
  try {
    const profiles = await profilesSchema.find();
    assertIsNonEmptyArray(profiles, 'error in this thing');
    const categories = await db.getAllCategories();

    for (let index = 0; index < profiles.length; index++) {
      const profile = profiles[index];
      const response = await profile
        .updateOne({
          $set: {
            forYouCategoryList: categories.map(({ name }) => ({
              categoryName: name,
              amount: 0,
            })),
          },
        })
        .catch((e) => console.error(e));
      console.log(response);
    }

    const movies = await movieSchema.find();
    assertIsNonEmptyArray(movies, 'error in this thing');

    // creditsDurationInMs: 480000
    for (let index = 0; index < movies.length; index++) {
      const movie = movies[index];
      const response = await movie
        .updateOne({ $set: { creditsDurationInMs: 480000 } })
        .catch((e) => console.error(e));
      console.log(response);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
  }
};

export const generateFFmpegToMovie = async (req: Request, res: Response) => {
  const { movieId } = req.params;
  try {
    const video = await db.findMovieById(movieId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    // const outputPath = slashesForOs('uploads/images/ffmpeg/');

    const previewImageArray = await generatePreviewImages({
      videoUrl: video.videoUrl,
      outputPath: 'uploads/images/ffmpeg/',
      fileName: cleanString(video.title), // no increment or extension
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
      console.log(error);
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

    const previewImageArray = await generatePreviewImages({
      videoUrl: video.videoUrl,
      outputPath: 'uploads/images/ffmpeg/',
      fileName: cleanString(`${video.seriesTitle}${video.episodeTitle}`), // no increment or extension
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

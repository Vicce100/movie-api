import { Request, Response } from 'express';
import fs from 'fs';

import movieSchema from '../schemas/movieSchema.js';
import db from '../utilities/db/index.js';
import { errorCode, mp4, url } from '../utilities/types.js';
import {
  assertNonNullish,
  assertIsNonEmptyArray,
} from '../utilities/assertions.js';
import { errorHandler } from '../utilities/middleware.js';
import { cleanString, generatePreviewImages } from '../utilities/index.js';

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
  if (isMovie) {
    try {
      await db.addViewToMovie(videoId);
      await db.addMonthlyViewToMovie(videoId);
    } catch (error) {
      console.log(error);
    }
  }
  res.status(200).json({ success: true });
};

export const postSingleVideo = async (req: Request, res: Response) => {
  const { files } = req;
  const {
    title,
    description,
    categories,
    releaseDate,
  }: {
    title: string;
    description: string;
    categories: string[] | string;
    releaseDate: string;
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
      });
      const { _id, videoUrl } = newMovie;
      await newMovie.save();
      await db.addUsersMovie(req.user._id, _id);

      // send response to client before running ffmpeg so client gets a faster response time
      res.status(201).json('video added');

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
    const isMovie = true;
    const video = await db.findMovieById(movieId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    res.status(200).json(db.returnVideo(video, isMovie));
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
    const isMovie = true;
    const video = await db.findEpisodeById(episodeId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    res.status(200).json(db.returnVideo(video, isMovie));
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getVideosData = (req: Request, res: Response) => {
  const { queryName } = req.params;

  res.status(200).json(queryName);
};

export const getMoviesDataByCategory = async (req: Request, res: Response) => {
  const { categoryName } = req.params;

  try {
    const videosFromCategory = await db.getMovieDataByCategory(categoryName);
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
  const { categoryName } = req.params;

  try {
    const videosFromCategory = await db.getSeriesDataByCategory(categoryName);
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

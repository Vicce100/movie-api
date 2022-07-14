import { Request, Response } from 'express';
import fs, { readSync } from 'fs';

import movieSchema from '../schemas/movieSchema.js';
import db from '../utilities/db/index.js';
import { errorCode, mp4, url } from '../utilities/types.js';
import {
  assertNonNullish,
  assertIsNonEmptyArray,
} from '../utilities/assertions.js';
import { errorHandler } from '../utilities/middleware.js';
import { cleanString, generatePreviewImages } from '../utilities/index.js';

export const getVideo = async (req: Request, res: Response) => {
  const { range } = req.headers;
  const { videoId } = req.params;
  if (!range) return res.status(404).send('Missing Requires Range header! ');

  try {
    const tempVideo = await db.findVideoById(videoId);
    assertNonNullish(tempVideo, errorCode.VALUE_MISSING);

    const videoPath = tempVideo.videoUrl;
    const videoSize = fs.statSync(videoPath).size;
    // const chunkSize = 1 * 1e6; // 1MB

    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ''));
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
      await db.addUsersVideos(req.user._id, _id);

      // send response to client before running ffmpeg so client gets a faster response time
      res.status(201).json('video added');

      const previewImageArray = await generatePreviewImages({
        videoUrl: videoUrl,
        outputPathAndFileName: `uploads/images/ffmpeg/${cleanString(title)}`, // no increment or extension
        fps: 1 / 10,
        resolution: '720x480',
      });

      await db.updateVideoPreviewImages(_id, previewImageArray);
    } catch (error) {
      console.log(error);
    }
  } else {
    const message = 'number of files dose not match number of titles';
    return res.status(400).json(db.returnErrorData(message, 400));
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const { _id: userId } = req.user;

  try {
    const movie = await db.findVideoById(videoId);
    assertNonNullish(movie, errorCode.VALUE_MISSING);
    if (userId !== movie.creatorsId)
      throw new Error(errorCode.PERMISSION_DENIED);

    (await movie.remove()).save();
    await db.removeUsersVideoRef(req.user._id, videoId);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getSingleVideoData = async (req: Request, res: Response) => {
  const { videoId } = req.params;

  try {
    const isMovie = true;
    const video = await db.findVideoById(videoId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    res.status(200).json(db.returnVideo(video, isMovie));
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const getVideosData = (req: Request, res: Response) => {};

export const getVideosDataByCategory = async (req: Request, res: Response) => {
  const { categoryName } = req.params;

  try {
    const videosFromCategory = await db.getVideoDataByCategory(categoryName);
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

export const generateFFmpegToVideo = async (req: Request, res: Response) => {
  const { videoId } = req.params;
  try {
    const video = await db.findVideoById(videoId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    const cleanedString = cleanString(video.title);

    const previewImageArray = await generatePreviewImages({
      videoUrl: video.videoUrl,
      outputPathAndFileName: `uploads/images/ffmpeg/${Date.now()}-${cleanedString}`, // no increment or extension
      fps: 1 / 10,
      resolution: '1080x720',
    });

    const response = await db.updateVideoPreviewImages(
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

export const removeFFmpegFromVideo = async (req: Request, res: Response) => {
  const { videoId } = req.params;
  try {
    const video = await db.findVideoById(videoId);
    assertNonNullish(video, errorCode.VALUE_MISSING);

    if (!video.previewImagesUrl.length)
      throw new Error(errorCode.VALUE_NOT_EXISTING);

    one: for (let index = 0; index < video.previewImagesUrl.length; index++) {
      if (!fs.existsSync(video.previewImagesUrl[index])) continue one;
      fs.unlinkSync(video.previewImagesUrl[index]);
    }
    const response = await db.deleteVideoPreviewImages(video._id);

    res.status(200).json({ success: response.acknowledged });
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    } else console.log(error);
  }
};

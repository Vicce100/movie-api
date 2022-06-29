import { Request, Response } from 'express';
import { CallbackError, Document } from 'mongoose';
import fs from 'fs';
import categorySchema from '../schemas/categorySchema.js';
import avatarSchema from '../schemas/avatarSchema.js';
import movieSchema from '../schemas/movieSchema.js';
import db from '../utilities/db/index.js';
import { CategorySchemaType, errorCode, mp4 } from '../utilities/types.js';
import { assertNullish, assertNonNullish } from '../utilities/assertions.js';
import { errorHandler } from '../utilities/middleware.js';

export const addSingleCategory = async (req: Request, res: Response) => {
  try {
    const category = await new categorySchema({
      name: req.body.category,
    }).save();
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const addMultipleCategories = (req: Request, res: Response) => {
  const { categories }: { categories: string[] } = req.body;
  categories.forEach(async (name) => {
    try {
      const tempCategory = await db.getSingleCategoryBaName(name);
      assertNullish(tempCategory, errorCode.VALUE_TAKEN);

      categories.forEach((tempCategory: string) => {
        try {
          new categorySchema({ name: tempCategory }).save(
            (err: CallbackError) => {
              if (err) throw new Error(err.message);
            }
          );
        } catch (error) {
          if (error instanceof Error) {
            const errorResponse = errorHandler(error);
            return res.status(Number(errorResponse.status)).json(errorResponse);
          }
        }
      });
      res.status(201).json(`category's added successfully`);
    } catch (error) {
      if (error instanceof Error) {
        const errorResponse = errorHandler(error);
        return res.status(Number(errorResponse.status)).json(errorResponse);
      }
    }
  });
};

export const sendSingleCategory = async (req: Request, res: Response) => {
  try {
    const data = await db.getSingleCategoryBaId(req.params.categoryId);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const sendMultipleCategories = async (_req: Request, res: Response) => {
  try {
    const data = await db.getAllCategories();
    res.json(data);
  } catch (error) {
    res.status(400).json(error);
  }
};

export const addSingleAvatar = async (req: Request, res: Response) => {
  const { file } = req;
  const { name, category }: { name: string; category: string[] | string } =
    req.body;
  if (!file) return res.status(400).send('No file or wrong file was uploaded!');
  let tempCategory: string[] | null = null;
  if (Array.isArray(category))
    tempCategory = category.map((tempCategory) => tempCategory);
  else tempCategory = [category];
  try {
    const tempAvatar = await new avatarSchema({
      categories: tempCategory,
      name,
      url: file.path.replaceAll(' ', '-'),
    }).save();

    res.status(201).json(tempAvatar);
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
  }
};

export const addMultipleAvatars = (req: Request, res: Response) => {
  if (!Array.isArray(req.files))
    return res.status(400).send('No file or wrong file was uploaded!');
  const { name, categories }: { name: string[]; categories: string[] } =
    req.body;

  const message = 'number of files dose not match number of names';
  if (req.files.length !== name.length)
    return res.status(400).json(db.returnErrorData(message, 400));

  req.files.forEach((file, index) => {
    new avatarSchema({
      name: name[index],
      url: file.path.replaceAll(' ', '-'),
      categories: categories
        .filter((category) => category === `${index}/${category.split('/')[1]}`)
        .map((category) => category.split('/')[1]),
    }).save((err: CallbackError) => (err ? res.status(400).send(err) : null));
  });
  res.status(201).json(`avatars added successfully`);
};

export const sendSingleAvatar = async (req: Request, res: Response) => {
  try {
    const data = await db.getSingleAvatarById(req.params.categoryId);
    res.status(200).json(db.returnAvatar(data));
  } catch (error) {
    res.status(400).send(error);
  }
};

export const sendMultipleAvatars = async (_req: Request, res: Response) => {
  try {
    const data = await db.getAllAvatars();
    res.json(data.map((d) => db.returnAvatar(d)));
  } catch (error) {
    res.status(400).json(error);
  }
};

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
        // album: files.album.map((file) => file.path) || [],
        categories: tempCategory,
        description,
        creatorsId: req.user._id,
        releaseDate,
      });
      const { _id } = newMovie;
      await newMovie.save();
      await db.addUsersVideos(req.user._id, _id);
    } catch (error) {
      console.log(error);
    }

    return res.status(201).json('video added');
  }
  const message = 'number of files dose not match number of titles';
  return res.status(400).json(db.returnErrorData(message, 400));
};

export const deleteVideo = async (req: Request, res: Response) => {
  const { videoId } = req.params;
  try {
    const movie = await db.findVideoById(videoId);
    assertNonNullish(movie, errorCode.VALUE_MISSING);
    if (req.user._id !== movie.creatorsId)
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

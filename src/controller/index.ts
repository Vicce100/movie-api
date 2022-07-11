import { Request, Response } from 'express';
import { CallbackError } from 'mongoose';

import categorySchema from '../schemas/categorySchema.js';
import avatarSchema from '../schemas/avatarSchema.js';
import db from '../utilities/db/index.js';
import { errorCode } from '../utilities/types.js';
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
  const { categoryId } = req.params;
  try {
    const data = await db.getSingleCategoryBaId(categoryId);
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
  const { categoryId } = req.params;
  try {
    const data = await db.getSingleAvatarById(categoryId);
    assertNonNullish(data, errorCode.VALUE_MISSING);
    res.status(200).json(db.returnAvatar(data));
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse = errorHandler(error);
      return res.status(Number(errorResponse.status)).json(errorResponse);
    }
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

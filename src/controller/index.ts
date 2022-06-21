import { Request, Response } from 'express';
import { CallbackError, Document } from 'mongoose';
import category from '../schemas/categorySchema.js';
import avatar from '../schemas/avatarSchema.js';
import db from '../utilities/db/index.js';
import { AvatarSchemaType, CategorySchemaType } from '../utilities/types.js';

export const addSingleCategory = (req: Request, res: Response) => {
  new category({ name: req.body.category }).save(
    (
      err: CallbackError,
      category: Document<unknown, any, CategorySchemaType> & CategorySchemaType
    ) => {
      if (err) return res.status(400).send(err);
      res.status(201).json(category);
    }
  );
};

export const addMultipleCategories = (req: Request, res: Response) => {
  req.body.categories.forEach((tempCategory: string) => {
    new category({ name: tempCategory }).save(
      (
        err: CallbackError,
        _category: Document<unknown, any, CategorySchemaType> &
          CategorySchemaType
      ) => (err ? res.status(400).send(err) : null)
    );
  });
  res.status(201).json(`category's added successfully`);
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

export const addSingleAvatar = (req: Request, res: Response) => {
  const { file } = req;
  const { name, category }: { name: string; category: string[] | string } =
    req.body;
  if (!file) return res.status(400).send('No file or wrong file was uploaded!');
  let tempCategory: string[] | null = null;
  if (Array.isArray(category))
    tempCategory = category.map((tempCategory) => tempCategory);
  else tempCategory = [category];
  new avatar({
    category: tempCategory,
    name,
    url: file.path.replaceAll(' ', '-'),
  }).save(
    (
      err: CallbackError,
      avatar: Document<unknown, any, AvatarSchemaType> & AvatarSchemaType
    ) => {
      if (err) return res.status(400).send(err);
      res.status(201).json(avatar);
    }
  );
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
    new avatar({
      name: name[index],
      url: file.path.replaceAll(' ', '-'),
      category: categories
        .filter((category) => category === `${index}/${category.split('/')[1]}`)
        .map((category) => category.split('/')[1]),
    }).save(
      (
        err: CallbackError,
        _avatar: Document<unknown, any, AvatarSchemaType> & AvatarSchemaType
      ) => (err ? res.status(400).send(err) : null)
    );
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

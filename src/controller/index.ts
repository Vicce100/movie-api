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
      category: Document<unknown, any, CategorySchemaType> &
        CategorySchemaType & {
          _id: string;
        }
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
          CategorySchemaType & {
            _id: string;
          }
      ) => {
        if (err) return res.status(400).send(err);
      }
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
    res.send(200).json(data);
  } catch (error) {
    res.status(400).json(error);
  }
};

export const addSingleAvatar = (req: Request, res: Response) => {
  const { file } = req;
  const { name, category }: { name: string; category: string[] } = req.body;
  if (!file) return res.status(400).send('No file or wrong file was uploaded!');
  new avatar({ category, name, url: file.path }).save(
    (
      err: CallbackError,
      avatar: Document<unknown, any, AvatarSchemaType> &
        AvatarSchemaType & {
          _id: string;
        }
    ) => {
      if (err) return res.status(400).send(err);
      res.status(201).json(avatar);
    }
  );
};

export const addMultipleAvatars = (req: Request, res: Response) => {
  if (!Array.isArray(req.files))
    return res.status(400).send('No file or wrong file was uploaded!');
  const { avatar } = req.body;

  const message = 'number of files dose not match number of names';
  if (req.files.length !== avatar.length)
    return res.status(400).json(db.returnErrorData(message, 400));

  req.files.forEach((file, index) => {
    new avatar({
      category: avatar[index].avatarCategory,
      name: avatar[index].avatarName,
      url: file.path,
    }).save(
      (
        err: CallbackError,
        _avatar: Document<unknown, any, AvatarSchemaType> &
          AvatarSchemaType & {
            _id: string;
          }
      ) => {
        if (err) return res.status(400).send(err);
      }
    );
  });
  res.status(201).json(`avatars added successfully`);
};

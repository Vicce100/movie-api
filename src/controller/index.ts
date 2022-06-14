import { Request, Response } from 'express';
import category from '../schemas/categorySchema.js';
import avatar from '../schemas/avatarSchema.js';
import api from '../utilities/api/index.js';
import { CallbackError, Document } from 'mongoose';
import { AvatarSchemaType } from '../utilities/types.js';

export const addSingleCategory = (req: Request, res: Response) => {
  if (!req.file)
    return res.status(400).send('No file or wrong file was uploaded!');

  new category({ name: req.body.name, url: req.file.path }).save(
    (err, category) => {
      if (err) return res.status(400).send(err);
      res.status(201).json(category);
    }
  );
};

export const addMultipleCategories = (req: Request, res: Response) => {
  if (!Array.isArray(req.files))
    return res.status(400).send('No file or wrong file was uploaded!');

  const message = 'number of files dose not match number of names';
  if (req.files.length !== req.body.categoryName.length)
    return res.status(400).json(api.returnErrorData(message, 400));

  req.files.forEach((file, index) => {
    new category({
      name: req.body.categoryName[index],
      url: file.path,
    }).save((err, _category) => {
      if (err) return res.status(400).send(err);
    });
  });
  res.status(201).json(`category's added successfully`);
};

export const addSingleAvatar = (req: Request, res: Response) => {
  const { file } = req;
  const { name, category }: { name: string; category: string[] } = req.body;
  if (!file) return res.status(400).send('No file or wrong file was uploaded!');
  new avatar({ category, name, url: file.path }).save((err, avatar) => {
    if (err) return res.status(400).send(err);
    res.status(201).json(avatar);
  });
};

export const addMultipleAvatars = (req: Request, res: Response) => {
  if (!Array.isArray(req.files))
    return res.status(400).send('No file or wrong file was uploaded!');
  const { avatar } = req.body;

  const message = 'number of files dose not match number of names';
  if (req.files.length !== avatar.length)
    return res.status(400).json(api.returnErrorData(message, 400));

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

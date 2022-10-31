import jwt from 'jsonwebtoken';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import * as validate from 'email-validator';

import { assertsIsString, assertNonNullish } from './assertions.js';
import { UserAsCookie, errorCode } from './types.js';
import db from './db/index.js';

export const routesString = Object.freeze({
  video: 'video',
  category: 'category',
  franchise: 'franchise',
  avatar: 'avatar',
  user: 'user',
  movie: 'movie',
  episode: 'episode',
  episodes: 'episodes',
  series: 'series',
  upload: 'upload',
  single: 'single',
  multiple: 'multiple',
  data: 'data',
  search: 'search',
  searchId: 'searchId',
  searchText: 'searchText',
  addView: 'addView',
  ffmpeg: 'ffmpeg',
  create: 'create',
  add: 'add',
  all: 'all',
  savedList: 'savedList',
  login: 'login',
  logout: 'logout',
  refreshToken: 'refreshToken',
  addProfile: 'addProfile',
  getCurrentUser: 'getCurrentUser',
  checkAuth: 'checkAuth',
  get: 'get',
  delete: 'delete',
  remove: 'remove',
  videoId: 'videoId',
  movieId: 'movieId',
  episodeId: 'episodeId',
  seriesId: 'seriesId',
  categoryId: 'categoryId',
  franchiseId: 'franchiseId',
  avatarId: 'avatarId',
  categoryName: 'categoryName',
  roleType: 'roleType',
});

export const generateAccessToken = (user: UserAsCookie) => {
  try {
    assertNonNullish(
      process.env.SECRET_ACCESS_TOKEN,
      errorCode.MISSING_ENV_TOKEN
    );
    return jwt.sign(
      JSON.parse(JSON.stringify(user)),
      process.env.SECRET_ACCESS_TOKEN,
      {
        expiresIn: '36500d',
      }
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
};

const characters = '/^()[]{}?!$"#¤%%&()=?`>|@£€*:;,-_';

export const cleanString = (str: string) => {
  for (let i = 0; i < characters.length; i++) {
    str = str.replaceAll(characters[i], '');
  }
  return str.trim().replaceAll(' ', '');
};

export const checkForEmailUniqueness = async (str: string) => {
  assertsIsString(str);
  return !(await db.EmailTaken(str.trim()));
};

export const emailIsValid = (email: string) => {
  if (!validate.validate(email)) throw new Error(errorCode.INVALID_EMAIL);
};

// return last index of created file
export const cleanFFmpegEndString = (string: string) =>
  Number(
    string
      .slice(string.length - 200, string.length)
      .replaceAll('\n', '')
      .split('frame=')[1]
      .split('fps')[0]
      .trim()
      .replaceAll(' ', '')
  );

export const generatePreviewImages = ({
  videoUrl,
  outputPathAndFileName, // no increment or extension
  fps = 1,
  resolution = '1080x720',
}: {
  videoUrl: string;
  outputPathAndFileName: string;
  fps: number;
  resolution: string;
}) => {
  if (!videoUrl || !outputPathAndFileName)
    throw new Error(errorCode.VALUE_MISSING);

  return new Promise<string[]>((resolve, reject) => {
    const cmd = ffmpeg(videoUrl);
    const fileName = `${new Date().toISOString()}-${outputPathAndFileName}`;

    cmd
      .FPS(fps)
      .size(resolution)
      .output(`${fileName}-%d.jpg`)
      // .on('start', (cmd) => console.log({ cmd }))
      .on('error', (error) => reject(new Error(error.message)))
      // .on('codecData', (data) => console.log(JSON.stringify(data, undefined, 2)))
      // .on('progress', (progress) => console.log(progress.percent))
      .on('end', (_error, file: string) => {
        const imagesNr = cleanFFmpegEndString(file);
        const tempPreviewImageArray: string[] = [];

        one: for (let index = 0; index <= imagesNr; index++) {
          if (!fs.existsSync(`${fileName}-${index}.jpg`)) continue one;
          tempPreviewImageArray.push(`${fileName}-${index}.jpg`);
        }
        resolve(tempPreviewImageArray);
      })
      .run();
  });
};

export const convertToMp4 = ({
  videoUrl,
  outputPathAndFileName, // no increment or extension
}: {
  videoUrl: string;
  outputPathAndFileName: string;
}) => {
  if (!videoUrl || !outputPathAndFileName)
    throw new Error(errorCode.VALUE_MISSING);

  return new Promise<{ success: boolean }>((resolve, reject) => {
    const cmd = ffmpeg(videoUrl);

    cmd
      .format('mp4')
      .input(`${outputPathAndFileName}--converted.mp4`)
      .on('error', (error) => reject(new Error(error.message)))
      .on('end', (error) =>
        error ? resolve({ success: false }) : resolve({ success: true })
      )
      .run();
  });
};

export const shuffleArray = <T>(array: T[]): T[] =>
  array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

export const deleteFile = (filePath: string) => {
  if (!filePath || !fs.existsSync(filePath))
    throw new Error(errorCode.VALUE_MISSING);
  fs.rmSync(filePath);
  return true;
};

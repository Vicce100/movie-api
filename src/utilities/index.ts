import jwt from 'jsonwebtoken';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import * as validate from 'email-validator';
import axios from 'axios';
import * as urlModule from 'url';

import { assertsIsString, assertNonNullish } from './assertions.js';
import { UserAsCookie, errorCode } from './types.js';
import db from './db/index.js';

export const routesString = Object.freeze({
  add: 'add',
  addProfile: 'addProfile',
  addView: 'addView',
  all: 'all',
  avatar: 'avatar',
  avatarId: 'avatarId',
  category: 'category',
  categoryName: 'categoryName',
  categoryId: 'categoryId',
  checkAuth: 'checkAuth',
  create: 'create',
  data: 'data',
  delete: 'delete',
  episode: 'episode',
  episodeId: 'episodeId',
  episodes: 'episodes',
  ffmpeg: 'ffmpeg',
  franchise: 'franchise',
  franchiseId: 'franchiseId',
  get: 'get',
  getCurrentUser: 'getCurrentUser',
  login: 'login',
  logout: 'logout',
  movie: 'movie',
  movieId: 'movieId',
  multiple: 'multiple',
  refreshToken: 'refreshToken',
  remove: 'remove',
  roleType: 'roleType',
  savedList: 'savedList',
  search: 'search',
  searchId: 'searchId',
  searchText: 'searchText',
  series: 'series',
  seriesId: 'seriesId',
  single: 'single',
  update: 'update',
  upload: 'upload',
  user: 'user',
  video: 'video',
  videoId: 'videoId',
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
  outputPath,
  fileName, // no increment or extension
  fps = 1,
  resolution = '1080x720',
}: {
  videoUrl: string;
  outputPath: string;
  fileName: string;
  fps: number;
  resolution: string;
}) => {
  if (!videoUrl || !outputPath || !fileName)
    throw new Error(errorCode.VALUE_MISSING);

  return new Promise<string[]>((resolve, reject) => {
    const cmd = ffmpeg(videoUrl);
    const filePathAndName = `${outputPath}${new Date()
      .toISOString()
      .replaceAll(':', '')
      .replaceAll('.', '')}-${fileName}`;

    cmd
      .FPS(fps)
      .size(resolution)
      .output(`${filePathAndName}-%d.jpg`)
      // .on('start', (cmd) => console.log({ cmd }))
      .on('error', (error) => reject(new Error(error.message)))
      // .on('codecData', (data) => console.log(JSON.stringify(data, undefined, 2)))
      // .on('progress', (progress) => console.log(progress.percent))
      .on('end', (_error, file: string) => {
        const imagesNr = cleanFFmpegEndString(file);
        const tempPreviewImageArray: string[] = [];

        one: for (let index = 0; index <= imagesNr; index++) {
          if (!fs.existsSync(`${filePathAndName}-${index}.jpg`)) continue one;
          tempPreviewImageArray.push(`${filePathAndName}-${index}.jpg`);
        }
        resolve(tempPreviewImageArray);
      })
      .run();
  });
};

export const convertToMp4 = ({
  videoUrl,
  outputPath,
  fileName, // no increment or extension
}: {
  videoUrl: string;
  outputPath: string;
  fileName: string;
}) => {
  if (!videoUrl || !outputPath || !fileName)
    throw new Error(errorCode.VALUE_MISSING);

  return new Promise<{ success: boolean }>((resolve, reject) => {
    const cmd = ffmpeg(videoUrl);

    cmd
      .format('mp4')
      .input(`${outputPath}${fileName}--converted.mp4`)
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

export const downloadFile = async (data: {
  url: string;
  filepath: string;
}): Promise<{
  fullPath: string;
  filepath: string;
  filename: string;
  filetype: string;
}> => {
  const { url, filepath } = data;
  const { pathname } = urlModule.parse(url);

  const [filetype, incompleteFilename] = [
    `.${pathname?.split('.')[pathname?.split('.').length - 1]}`,
    pathname?.split('/')[pathname?.split('/').length - 1].split('.')[0],
  ];

  assertsIsString(incompleteFilename);
  const filename = `${Date.now()}-${cleanString(incompleteFilename)}`;

  const fullPath = `${filepath}${filename}${filetype}`;

  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    return new Promise((resolve, reject) => {
      response.data
        .pipe(fs.createWriteStream(fullPath))
        .on('error', (err: any) => reject(err))
        .once('close', () =>
          resolve({ fullPath, filepath, filename, filetype })
        );
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

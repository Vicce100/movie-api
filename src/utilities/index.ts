import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
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
  id: 'id',
  infinity: 'infinity',
  likedList: 'likedList',
  login: 'login',
  logout: 'logout',
  movie: 'movie',
  movieId: 'movieId',
  multiple: 'multiple',
  play: 'play',
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

/**
 * Generate Access Token for User Authentication
 *
 * @param  user  The User to be Authenticated.
 * @returns Returns a JWT Binned to the User.
 */
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

/**
 * Return the Last Index of a Created File
 */
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

/**
 * Take a path and return a string with slashes or backslashes based on Operation system.
 *
 * @param   folderPath  The path to the folder.
 * @returns The folder with slashes or backslashes.
 */
export const slashesForOs = (folderPath: string) => {
  if (folderPath.includes('/') && process.platform === 'win32')
    return folderPath.replaceAll('/', '\\');
  else if (folderPath.includes('\\') && process.platform === 'win32')
    return folderPath.replaceAll('\\', '\\');
  else if (folderPath.includes('/') && process.platform === 'linux')
    return folderPath.replaceAll('/', '/');
  else if (folderPath.includes('\\') && process.platform === 'linux')
    return folderPath.replaceAll('\\', '/');

  return folderPath;
};

/**
 * Function to Generate Preview Images From a Video File.
 *
 * @param  {string} videoUrl  URL of the Video to Extract Images From.
 * @param  outputPath Path for the Output Files.
 * @param  fileName Name of File | Exclude increments or Extensions.
 * @param  fps Frames Per Secund | Standard value as 1 Frame every Secund.
 * @param  resolution Resolution | Standard Value as 1080x720P.
 * @returns Returns an Array of String Values aka Return an Array of Preview Image URL's
 */
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
    const filePathAndName = slashesForOs(
      `${outputPath}${new Date()
        .toISOString()
        .replaceAll(':', '')
        .replaceAll('.', '')}-${fileName}`
    );

    cmd
      .FPS(fps)
      .size(resolution)
      .output(`${filePathAndName}-%d.jpg`)
      // .on('start', (cmd) => console.log({ cmd }))
      .on('error', (error) => {
        console.log(error);
        reject(new Error(error.message));
      })
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

/**
 * Return an Array in Random Order.
 *
 * @param   array Array to Return in Random Order.
 * @returns Returns the Array in Random Order
 */
export const shuffleArray = <T>(array: T[]): T[] =>
  array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

/**
 * Deleting a File
 *
 * @param   filePath  The Path of the File.
 * @returns Returns True if deletions was Successfully.
 */
export const deleteFile = (filePath: string) => {
  if (!filePath || !fs.existsSync(filePath))
    throw new Error(`${errorCode.VALUE_MISSING} at path ${filePath}`);
  fs.rmSync(filePath);
  return true;
};

/**
 * Take a url of a file and downloads it.
 *
 * @param   folderPath  The path to the folder.
 * @returns Returns the downloaded file.
 */
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

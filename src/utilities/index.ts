import jwt from 'jsonwebtoken';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import * as validate from 'email-validator';

import { assertsIsString, assertNonNullish } from './assertions.js';
import { UserType, errorCode } from './types.js';
import db from './db/index.js';

export const routesString = {
  video: 'video' as const,
  category: 'category' as const,
  franchise: 'franchise' as const,
  avatar: 'avatar' as const,
  user: 'user' as const,
  movie: 'movie' as const,
  episode: 'episode' as const,
  series: 'series' as const,
  upload: 'upload' as const,
  single: 'single' as const,
  multiple: 'multiple' as const,
  data: 'data' as const,
  search: 'search' as const,
  searchId: 'searchId' as const,
  searchText: 'searchText' as const,
  addView: 'addView' as const,
  ffmpeg: 'ffmpeg' as const,
  create: 'create' as const,
  add: 'add' as const,
  login: 'login' as const,
  logout: 'logout' as const,
  refreshToken: 'refreshToken' as const,
  addProfile: 'addProfile' as const,
  getCurrentUser: 'getCurrentUser' as const,
  checkAuth: 'checkAuth' as const,
  get: 'get' as const,
  delete: 'delete' as const,
  remove: 'remove' as const,
  videoId: 'videoId' as const,
  movieId: 'movieId' as const,
  episodeId: 'episodesId' as const,
  seriesId: 'seriesId' as const,
  categoryId: 'categoryId' as const,
  franchiseId: 'franchiseId' as const,
  avatarId: 'avatarId' as const,
  categoryName: 'categoryName' as const,
  roleType: 'roleType' as const,
};

export const generateAccessToken = (user: UserType) => {
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

    cmd
      .FPS(fps)
      .size(resolution)
      .output(`${outputPathAndFileName}-%d.jpg`)
      // .on('start', (cmd) => console.log({ cmd }))
      .on('error', (error) => reject(new Error(error.message)))
      // .on('codecData', (data) => console.log(JSON.stringify(data, undefined, 2)))
      // .on('progress', (progress) => console.log(progress.percent))
      .on('end', (_error, file: string) => {
        const imagesNr = cleanFFmpegEndString(file);
        const tempPreviewImageArray: string[] = [];

        one: for (let index = 0; index <= imagesNr; index++) {
          if (!fs.existsSync(`${outputPathAndFileName}-${index}.jpg`))
            continue one;
          tempPreviewImageArray.push(`${outputPathAndFileName}-${index}.jpg`);
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

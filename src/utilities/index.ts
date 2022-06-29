import jwt from 'jsonwebtoken';

import { assertsIsString, assertNonNullish } from './assertions.js';
import { UserType, errorCode } from './types.js';
import db from './db/index.js';

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

const characters = '/^()[]{}?!$!"#¤%%&/()=?`>|@£€*:;,.-_';

export const cleanString = (str: string) => {
  for (let i = 0; i < characters.length; i++) {
    str = str.replaceAll(characters[i], '');
  }
  return str.trim();
};

export const checkForEmailUniqueness = async (str: string) => {
  assertsIsString(str);
  return !(await db.EmailTaken(str.trim()));
};

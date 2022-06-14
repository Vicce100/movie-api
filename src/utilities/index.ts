import jwt from 'jsonwebtoken';
import { UserType } from './types.js';

export const generateAccessToken = (user: UserType) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  jwt.sign(JSON.parse(JSON.stringify(user)), process.env.SECRET_ACCESS_TOKEN!, {
    expiresIn: '36500d',
  });

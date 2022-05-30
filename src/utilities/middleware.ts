/* eslint-disable import/prefer-default-export */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// authentication middelware
export const authenticateToken = (req: any, res: any, next: () => void) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (token === null)
    return res.status(401).json({ message: 'No token where send. ' });

  if (process.env.SECRET_ACCESS_TOKEN) {
    jwt.verify(
      token,
      process.env.SECRET_ACCESS_TOKEN,
      (err: unknown, user: unknown) => {
        if (err)
          return res
            .status(403)
            .json({ message: 'Cannot acces this with the token you sent. ' });
        req.user = user;
        next();
      }
    );
  }
};

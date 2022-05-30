/* eslint-disable import/prefer-default-export */
/* eslint-disable import/named */
import jwt from 'jsonwebtoken';
export const generateAccessToken = (user) => 
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
    expiresIn: '365d',
});

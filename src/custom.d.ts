import { UserAsCookie } from './utilities/types.js';

declare global {
  namespace Express {
    interface Request {
      user: UserAsCookie;
    }
  }
}

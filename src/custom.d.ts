import { UserType } from './utilities/types.js';

declare global {
  namespace Express {
    interface Request {
      user: UserType;
    }
  }
}

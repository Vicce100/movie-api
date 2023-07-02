// only allows commonjs unless using default import for mongoose
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { UserType } from '../utilities/types.js';

const idRefs = { type: mongoose.SchemaTypes.ObjectId };
const reqString = { type: String, require: true };
const requiredShortString = { ...reqString, minLength: 1, maxLength: 255 };

const userSchema = new mongoose.Schema({
  username: { type: String, default: '', required: false, unique: false },
  email: {
    ...reqString,
    unique: true,
    lowercase: true,
    min: 4,
    max: 255,
  },
  firstName: requiredShortString,
  lastName: requiredShortString,
  role: { type: String, default: 'user' },
  userStatus: { type: String, default: 'active' },
  password: reqString,
  refreshToken: { type: String || null, require: false },
  createdAt: {
    type: String,
    default: () => dayjs().format(),
    imitable: true,
  },
  moviesUploaded: [{ ...idRefs, require: true, ref: 'movie' }],
  seriesUploaded: [{ ...idRefs, require: true, ref: 'series' }],
});

export default mongoose.model<UserType>('users', userSchema);

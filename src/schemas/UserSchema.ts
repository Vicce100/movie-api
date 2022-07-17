import mongoose from 'mongoose'; // only allows commonjs unless using default import
import dayjs from 'dayjs';
// import { v4 as uuidV4 } from 'uuid';
import { UserType } from '../utilities/types.js';

const reqString = { type: String, require: true };
const uniqueString = { ...reqString, unique: true };
const ShortString = { type: String, minLength: 1, maxLength: 255 };
const nonRequiredShortString = { ...ShortString, require: false };
const requiredShortString = { ...ShortString, require: true };

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
    unique: true,
    lowercase: true,
    min: 4,
    max: 255,
  },
  firstName: requiredShortString,
  lastName: requiredShortString,
  profiles: [
    {
      profileName: requiredShortString,
      avatarURL: reqString,
      savedList: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'video' }],
    },
  ],
  role: { type: String, require: true, default: 'user' },
  userStatus: { type: String, require: true, default: 'active' },
  password: reqString,
  refreshToken: { type: String || null, require: false },
  createdAt: {
    type: String,
    default: () => dayjs().format(),
    imitable: true,
    require: true,
  },
  videosUploaded: [
    { type: mongoose.SchemaTypes.ObjectId, require: true, ref: 'video' },
  ],
});

export default mongoose.model<UserType>('Users', UserSchema);

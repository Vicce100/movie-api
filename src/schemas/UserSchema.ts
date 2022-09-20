// only allows commonjs unless using default import for mongoose
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { UserType } from '../utilities/types.js';

const idRefs = { type: mongoose.SchemaTypes.ObjectId };
const reqMongoId = { ...idRefs, require: true };
const reqString = { type: String, require: true };
const requiredShortString = { ...reqString, minLength: 1, maxLength: 255 };

const userSchema = new mongoose.Schema({
  email: {
    ...reqString,
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
      savedList: [{ ...idRefs }],
      likedList: [{ ...idRefs }],
      hasWatch: [{ ...idRefs }],
      isWatchingMovie: [
        {
          movieId: { ...reqMongoId, ref: 'movie' },
          trackId: { type: Number, require: true },
        },
      ],
      isWatchingSeries: [
        {
          seriesId: { ...reqMongoId },
          activeEpisode: {
            episodeId: { ...reqMongoId, ref: 'episode' },
            trackId: { type: Number, require: true },
          },
          watchedEpisodes: [
            {
              episodeId: { ...reqMongoId, ref: 'episode' },
              trackId: { type: Number, require: true },
            },
          ],
        },
      ],
    },
  ],
  role: { ...reqString, default: 'user' },
  userStatus: { ...reqString, default: 'active' },
  password: reqString,
  refreshToken: { type: String || null, require: false },
  createdAt: {
    ...reqString,
    default: () => dayjs().format(),
    imitable: true,
  },
  moviesUploaded: [{ ...idRefs, require: true, ref: 'movie' }],
  seriesUploaded: [{ ...idRefs, require: true, ref: 'series' }],
});

export default mongoose.model<UserType>('users', userSchema);

// only allows commonjs unless using default import for mongoose
import mongoose from 'mongoose';
import { ProfileType } from '../utilities/types.js';

const idRefs = { type: mongoose.SchemaTypes.ObjectId };
const reqMongoId = { ...idRefs, require: true };
const reqString = { type: String, require: true };
const requiredShortString = { ...reqString, minLength: 1, maxLength: 255 };

const profileSchema = new mongoose.Schema({
  usersId: reqMongoId,
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
});

export default mongoose.model<ProfileType>('profile', profileSchema);

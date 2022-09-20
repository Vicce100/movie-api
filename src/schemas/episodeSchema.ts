import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { EpisodeSchemaType } from '../utilities/types.js';

const idRefs = { type: mongoose.SchemaTypes.ObjectId };
const reqMongoId = { ...idRefs, require: true };
const reqString = { type: String, require: true };
const ShortString = { type: String, minLength: 1, maxLength: 255 };
const requiredShortString = { ...ShortString, require: true };
const date = {
  type: String,
  default: () => dayjs().format(),
  imitable: true,
  require: true,
};

const episodeSchema = new mongoose.Schema({
  seriesTitle: requiredShortString,
  episodeTitle: requiredShortString,
  seriesId: { ...reqMongoId, ref: 'series' },
  durationInMs: { type: Number, require: true },
  videoUrl: { ...reqString, unique: true },
  displayPicture: { ...reqString },
  previewImagesUrl: [{ type: String, require: true }],
  views: { type: Number, require: true },
  description: { type: String, require: false, maxLength: 1225 },
  uploadDate: date,
  releaseDate: { type: String, imitable: false, require: true },
  seasonNr: { type: Number, require: true },
  episodeNr: { type: Number, require: true },
  creatorsId: { ...reqMongoId, ref: 'users' },
});

export default mongoose.model<EpisodeSchemaType>('episode', episodeSchema);

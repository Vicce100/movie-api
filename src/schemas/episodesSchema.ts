import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { EpisodeSchemaType } from '../utilities/types.js';

const reqString = { type: String, require: true };
const ShortString = { type: String, minLength: 1, maxLength: 255 };
const requiredShortString = { ...ShortString, require: true };
const date = {
  type: String,
  default: () => dayjs().format(),
  imitable: true,
  require: true,
};

const episodesSchema = new mongoose.Schema({
  seriesTitle: requiredShortString,
  episodeTitle: requiredShortString,
  seriesId: { type: mongoose.SchemaTypes.ObjectId, ref: 'series' },
  videoUrl: { ...reqString, unique: true },
  displayPicture: { ...reqString },
  previewImagesUrl: [{ type: String, require: true }],
  views: { type: Number, require: true },
  description: { type: String, require: false, maxLength: 1225 },
  uploadDate: date,
  releaseDate: date,
  sessionNr: { type: Number, require: true },
  episodeNr: { type: Number, require: true },
  creatorsId: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
});

export default mongoose.model<EpisodeSchemaType>('episode', episodesSchema);

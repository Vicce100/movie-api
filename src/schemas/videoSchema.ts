import mongoose from 'mongoose'; // only allows commonjs unless using default import
import dayjs from 'dayjs';
import { UserType } from '../utilities/types.js';

const reqString = { type: String, require: true };
const ShortString = { type: String, minLength: 1, maxLength: 255 };
const requiredShortString = { ...ShortString, require: true };
const date = {
  type: String,
  default: () => dayjs().format(),
  imitable: true,
  require: true,
};

const videoSchema = new mongoose.Schema({
  title: requiredShortString,
  videoUrl: { ...reqString, unique: true },
  displayPicture: { ...reqString },
  album: [{ url: { type: String, require: true } }],
  category: [{ type: String, require: true }],
  description: { type: String, require: false, maxLength: 1225 },
  uploadDate: date,
  releaseDate: date,
});

export default mongoose.model<UserType>('video', videoSchema);

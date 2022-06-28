import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { VideoSchemaType } from '../utilities/types.js';

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
  // album: [{ url: { ...reqString } }],
  categories: [{ ...reqString }],
  description: { type: String, require: false, maxLength: 1225 },
  creatorsId: { type: mongoose.SchemaTypes.ObjectId, ref: 'Users' },
  uploadDate: date,
  releaseDate: { type: String, imitable: true, require: true },
});

export default mongoose.model<VideoSchemaType>('video', videoSchema);

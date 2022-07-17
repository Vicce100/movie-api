import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { MovieSchemaType } from '../utilities/types.js';

const reqString = { type: String, require: true };
const ShortString = { type: String, minLength: 1, maxLength: 255 };
const requiredShortString = { ...ShortString, require: true };
const date = {
  type: String,
  default: () => dayjs().format(),
  imitable: true,
  require: true,
};

const MovieSchema = new mongoose.Schema({
  title: requiredShortString,
  videoUrl: { ...reqString, unique: true },
  displayPicture: { ...reqString },
  previewImagesUrl: [{ type: String, require: true }],
  // album: [{ url: { ...reqString } }],
  categories: [{ ...reqString }],
  description: { type: String, require: false, maxLength: 1225 },
  views: { type: Number, require: true },
  monthlyViews: { type: Number, require: true },
  creatorsId: { type: mongoose.SchemaTypes.ObjectId, ref: 'Users' },
  uploadDate: date,
  releaseDate: { type: String, imitable: true, require: true },
});

export default mongoose.model<MovieSchemaType>('movie', MovieSchema);

import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { MovieSchemaType } from '../utilities/types.js';

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

const MovieSchema = new mongoose.Schema({
  title: requiredShortString,
  videoUrl: { ...reqString },
  displayPicture: { ...reqString },
  previewImagesUrl: [{ type: String, require: true }],
  backdropPath: { type: String, require: true },
  durationInMs: { type: Number, require: true },
  creditsDurationInMs: { type: Number, require: true, default: () => 480000 }, // 480.000 ms = 8 min
  public: { type: Boolean, default: () => false, require: true },
  categories: [{ ...reqString }],
  franchise: [{ ...reqString }],
  description: { type: String, require: false, maxLength: 1225 },
  views: { type: Number, require: true },
  monthlyViews: { type: Number, require: true },
  creatorsId: { ...reqMongoId, ref: 'users' },
  uploadDate: date,
  releaseDate: { type: String, imitable: true, require: true },
});

export default mongoose.model<MovieSchemaType>('movie', MovieSchema);

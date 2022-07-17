import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { SeriesInfoType } from '../utilities/types.js';

const reqString = { type: String, require: true };
const ShortString = { type: String, minLength: 1, maxLength: 255 };
const requiredShortString = { ...ShortString, require: true };
const date = {
  type: String,
  default: () => dayjs().format(),
  imitable: true,
  require: true,
};

const seriesSchema = new mongoose.Schema({
  title: requiredShortString,
  videoUrl: { ...reqString, unique: true },
  displayPicture: { ...reqString },
  previewImagesUrl: [{ type: String, require: true }],
  public: { type: Boolean, default: () => false, require: true },
  categories: [{ ...reqString }],
  description: { type: String, require: false, maxLength: 1225 },
  views: { type: Number, require: true },
  monthlyViews: { type: Number, require: true },
  uploadDate: date,
  creationDate: date,
  latestDate: date,
  episodesId: [{ type: mongoose.Types.ObjectId }],
  amountOfSessions: { type: Number },
  creatorsId: { type: mongoose.SchemaTypes.ObjectId, ref: 'Users' },
});

export default mongoose.model<SeriesInfoType>('series', seriesSchema);

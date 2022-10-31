import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { SeriesSchemaType } from '../utilities/types.js';

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

const seriesSchema = new mongoose.Schema({
  title: requiredShortString,
  displayPicture: { ...reqString },
  public: { type: Boolean, default: () => false, require: true },
  categories: [{ ...reqString }],
  franchise: [{ ...reqString }],
  description: { type: String, require: false, maxLength: 1225 },
  views: { type: Number, require: true },
  monthlyViews: { type: Number, require: true },
  // uploaded to servers
  uploadDate: date,
  // first release
  creationDate: { type: String, imitable: true, require: true },
  // last release
  latestDate: { type: String, imitable: false, require: true },
  episodes: [{ ...reqMongoId, ref: 'episode' }],
  amountOfSessions: { type: Number, require: true },
  amountOfEpisodes: { type: Number, require: true },
  creatorsId: { ...reqMongoId, ref: 'Users' },
});

export default mongoose.model<SeriesSchemaType>('series', seriesSchema);

import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { SeriesSchemaType } from '../utilities/types.js';

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
  franchise: [{ ...reqString }],
  description: { type: String, require: false, maxLength: 1225 },
  views: { type: Number, require: true },
  monthlyViews: { type: Number, require: true },
  uploadDate: date,
  creationDate: date,
  latestDate: date,
  episodes: [
    {
      episodeId: { type: mongoose.Types.ObjectId, require: true },
      seasonNr: { type: Number, require: true },
      episodeNr: { type: Number, require: true },
    },
  ],
  amountOfSessions: { type: Number, require: true },
  amountOfEpisodes: { type: Number, require: true },
  creatorsId: { type: mongoose.SchemaTypes.ObjectId, ref: 'Users' },
});

export default mongoose.model<SeriesSchemaType>('series', seriesSchema);

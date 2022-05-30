import mongoose from 'mongoose'; // only allows commonjs unless using default import
import dayjs from 'dayjs';

const uniqueString = { type: String, requier: true, unique: true };
const reqString = { type: String, requier: true };
const ShortString = {
  type: String,
  requier: true,
  minLenght: 1,
  maxLenght: 255,
};

const UserSchema = new mongoose.Schema({
  username: uniqueString,
  name: ShortString,
  email: {
    type: String,
    require: true,
    unique: true,
    lowercase: true,
    min: 1,
    max: 255,
  },
  password: reqString,
  refreshToken: { type: String, require: false },
  createdAt: {
    type: String,
    default: () => dayjs().format(),
    imutable: true,
    require: true,
  },
});

export default mongoose.model('Users', UserSchema);

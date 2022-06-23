import mongoose from 'mongoose';
import { AvatarSchemaType } from '../utilities/types.js';

const avatarSchema = new mongoose.Schema({
  categories: [{ type: String, require: true }],
  name: {
    type: String,
    minLength: 1,
    maxLength: 255,
    require: true,
    unique: true,
  },
  url: { type: String, require: true },
});

export default mongoose.model<AvatarSchemaType>('avatar', avatarSchema);

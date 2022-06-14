import mongoose from 'mongoose';
import { CategorySchemaType } from '../utilities/types';

export const categorySchema = new mongoose.Schema({
  name: { type: String, require: true, unique: true },
  // url: { type: String, require: true },
});

export default mongoose.model<CategorySchemaType>('category', categorySchema);

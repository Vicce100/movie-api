import mongoose from 'mongoose';
import { FranchiseSchemaType } from '../utilities/types.js';

const franchiseSchema = new mongoose.Schema({
  name: { type: String, require: true, unique: true },
});

export default mongoose.model<FranchiseSchemaType>(
  'franchise',
  franchiseSchema
);

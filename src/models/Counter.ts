import mongoose, { Schema } from 'mongoose';

export interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { collection: 'counters' }
);

export const Counter = mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

/**
 * Atomic sequence generator for Application IDs
 * Format: RAP-YYYY-000001
 */
export async function getNextApplicationId(year: number = new Date().getFullYear()): Promise<string> {
  const sequenceKey = `applicationId_${year}`;
  const counter = await Counter.findByIdAndUpdate(
    sequenceKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  
  const paddedSeq = String(counter.seq).padStart(6, '0');
  return `RAP-${year}-${paddedSeq}`;
}

import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
  role: 'HR_ADMIN';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['HR_ADMIN'],
      default: 'HR_ADMIN',
    },
    isActive: {
      type: booleanType(),
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

function booleanType() {
  return Boolean;
}

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);

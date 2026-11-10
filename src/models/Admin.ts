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

AdminSchema.pre('save', async function (next) {
  if (this.isNew) {
    const adminModel = (this.constructor as mongoose.Model<IAdmin>);
    const count = await adminModel.countDocuments();
    if (count >= 2) {
      return next(new Error('Sign up limit reached: Maximum 2 accounts are allowed in the database. Additional registrations are blocked.'));
    }
  }
  next();
});

function booleanType() {
  return Boolean;
}

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);





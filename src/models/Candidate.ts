import mongoose, { Schema, Document } from 'mongoose';
import { CandidateRecord, PreferredJobRole, ApplicationStatus } from '@/types';

export interface ICandidate extends Omit<CandidateRecord, '_id'>, Document {}

const PersonalDetailsSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { type: String, required: true, trim: true },
    maritalStatus: { type: String, required: true, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
    fathersName: { type: String, required: true, trim: true },
    mothersName: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const FamilyDetailsSchema = new Schema(
  {
    fathersOccupation: { type: String, trim: true },
    fathersMobile: { type: String, trim: true },
    mothersOccupation: { type: String, trim: true },
    mothersMobile: { type: String, trim: true },
    spouseName: { type: String, trim: true },
    marriageDate: { type: String },
    numberOfChildren: { type: Number, default: 0 },
  },
  { _id: false }
);

const ContactDetailsSchema = new Schema(
  {
    mobileNumber: { type: String, required: true, trim: true },
    alternativeMobileNumber: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    alternativeEmail: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const AddressSubSchema = new Schema(
  {
    doorNoStreet: { type: String, required: true, trim: true },
    villageOrArea: { type: String, required: true, trim: true },
    taluk: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const AddressDetailsSchema = new Schema(
  {
    permanentAddress: { type: AddressSubSchema, required: true },
    temporaryAddress: { type: AddressSubSchema, required: true },
    sameAsPermanent: { type: Boolean, default: false },
  },
  { _id: false }
);

const EducationDetailsSchema = new Schema(
  {
    highestQualification: { type: String, required: true, trim: true },
    institutionName: { type: String, required: true, trim: true },
    additionalQualification: { type: String, trim: true },
    passingYear: { type: String, required: true, trim: true },
    percentageOrGrade: { type: String, trim: true },
  },
  { _id: false }
);

const EmploymentDetailsSchema = new Schema(
  {
    hasPreviousExperience: { type: Boolean, default: false },
    previousOccupation: { type: String, trim: true },
    previousCompanyName: { type: String, trim: true },
    experienceDurationYears: { type: Number, default: 0 },
    experienceDurationMonths: { type: Number, default: 0 },
    lastDrawnSalary: { type: String, trim: true },
    reasonForLeaving: { type: String, trim: true },
  },
  { _id: false }
);

const ReferenceDetailsSchema = new Schema(
  {
    referralSource: {
      type: String,
      required: true,
      enum: ['Walk-in Direct', 'Friend', 'Reference', 'Advertisement', 'Other'],
    },
    referrerName: { type: String, trim: true },
    referrerContact: { type: String, trim: true },
    additionalRemarks: { type: String, trim: true },
  },
  { _id: false }
);

const CandidateSchema = new Schema<ICandidate>(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    personalDetails: { type: PersonalDetailsSchema, required: true },
    familyDetails: { type: FamilyDetailsSchema, default: {} },
    contactDetails: { type: ContactDetailsSchema, required: true },
    addressDetails: { type: AddressDetailsSchema, required: true },
    educationDetails: { type: EducationDetailsSchema, required: true },
    employmentDetails: { type: EmploymentDetailsSchema, default: {} },
    preferredJobRole: {
      type: String,
      required: true,
      enum: ['GOLD', 'NIDHI', 'MFI', 'CHIT', 'INSURANCE'],
      index: true,
    },
    referenceDetails: { type: ReferenceDetailsSchema, required: true },
    photographStorageKey: {
      type: String,
      required: true,
    },
    photographFileName: {
      type: String,
    },
    photographMimeType: {
      type: String,
    },
    applicationStatus: {
      type: String,
      enum: ['NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED'],
      default: 'NEW',
      index: true,
    },
    statusNotes: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes for rapid query performance
CandidateSchema.index({ 'personalDetails.fullName': 'text', 'contactDetails.mobileNumber': 'text', applicationId: 'text' });
CandidateSchema.index({ preferredJobRole: 1, applicationStatus: 1, submittedAt: -1 });

export const Candidate = mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);

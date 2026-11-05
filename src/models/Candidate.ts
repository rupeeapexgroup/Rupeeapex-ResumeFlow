import mongoose, { Schema, Document } from 'mongoose';
import { CandidateRecord, PreferredJobRole, ApplicationStatus } from '@/types';

export interface ICandidate extends Omit<CandidateRecord, '_id'>, Document {}

const PersonalDetailsSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    bloodGroup: { type: String, trim: true },
    maritalStatus: { type: String, required: true, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
    fathersName: { type: String, required: true, trim: true },
    mothersName: { type: String, required: true, trim: true },
    spouseName: { type: String, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    alternativeMobileNumber: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    aadhaarNumber: { type: String, required: true, trim: true },
    panNumber: { type: String, required: true, trim: true, uppercase: true },
  },
  { _id: false }
);

const FamilyDetailsSchema = new Schema(
  {
    fathersOccupation: { type: String, trim: true },
    fathersMobile: { type: String, trim: true },
    mothersOccupation: { type: String, trim: true },
    mothersMobile: { type: String, trim: true },
    spouseOccupation: { type: String, trim: true },
    spouseName: { type: String, trim: true },
    marriageDate: { type: String },
    numberOfChildren: { type: Number, default: 0 },
  },
  { _id: false }
);

const ContactDetailsSchema = new Schema(
  {
    mobileNumber: { type: String, trim: true },
    alternativeMobileNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
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
    educationDetails: { type: String, trim: true },
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
    previousCompany: { type: String, trim: true },
    previousDesignation: { type: String, trim: true },
    yearsOfExperience: { type: Number, default: 0 },
    previousCompany2: { type: String, trim: true },
    previousDesignation2: { type: String, trim: true },
    yearsOfExperience2: { type: Number, default: 0 },
    previousCompany3: { type: String, trim: true },
    previousDesignation3: { type: String, trim: true },
    yearsOfExperience3: { type: Number, default: 0 },
    previousOccupation: { type: String, trim: true },
    previousCompanyName: { type: String, trim: true },
    experienceDurationYears: { type: Number, default: 0 },
    experienceDurationMonths: { type: Number, default: 0 },
    lastDrawnSalary: { type: String, trim: true },
    reasonForLeaving: { type: String, trim: true },
    previouslyWorkedHere: { type: Boolean, default: false },
    previousEmployeeId: { type: String, trim: true },
    previousBranch: { type: String, trim: true },
    relievingYear: { type: String, trim: true },
    joinDesignation: { type: String, trim: true },
    relievingDesignation: { type: String, trim: true },
    dateOfRelieving: { type: String, trim: true },
    reasonForRelieving: { type: String, trim: true },
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
    contactDetails: { type: ContactDetailsSchema, default: {} },
    addressDetails: { type: AddressDetailsSchema, required: true },
    educationDetails: { type: EducationDetailsSchema, required: true },
    employmentDetails: { type: EmploymentDetailsSchema, default: {} },
    preferredJobRole: {
      type: String,
      required: true,
      enum: ['GOLD', 'NIDHI', 'MFI', 'CHIT', 'INSURANCE', 'OTHER'],
      index: true,
    },
    preferredJobRoleOther: {
      type: String,
      trim: true,
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
    isExEmployee: {
      type: Boolean,
      default: false,
      index: true,
    },
    isRepeatApplicant: {
      type: Boolean,
      default: false,
      index: true,
    },
    previousApplicationId: {
      type: String,
      trim: true,
    },
    previousApplicationsCount: {
      type: Number,
      default: 0,
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
CandidateSchema.index({
  'personalDetails.fullName': 'text',
  'personalDetails.mobileNumber': 'text',
  'personalDetails.aadhaarNumber': 'text',
  'personalDetails.panNumber': 'text',
  applicationId: 'text',
});
CandidateSchema.index({ preferredJobRole: 1, applicationStatus: 1, submittedAt: -1 });

export const Candidate = mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);

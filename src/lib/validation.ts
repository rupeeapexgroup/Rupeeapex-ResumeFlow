import { z } from 'zod';
import { PREFERRED_JOB_ROLES } from './constants';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const statusUpdateSchema = z.object({
  applicationStatus: z.enum(['NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED']),
  statusNotes: z.string().max(1000).optional(),
});

export const addressSchema = z.object({
  doorNoStreet: z.string().min(1, 'Street / Door No is required').trim(),
  villageOrArea: z.string().min(1, 'Area / Village is required').trim(),
  taluk: z.string().min(1, 'Taluk is required').trim(),
  district: z.string().min(1, 'District is required').trim(),
  state: z.string().min(1, 'State is required').trim(),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit Pincode').trim(),
});

export const candidateApplicationSchema = z.object({
  personalDetails: z.object({
    fullName: z.string().min(2, 'Full Name is required (min 2 characters)').trim(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Date of Birth (YYYY-MM-DD) is required'),
    age: z.coerce.number().min(18, 'Minimum age is 18 years').max(70, 'Age must be 70 or below'),
    gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Please select gender' }),
    bloodGroup: z.string().min(1, 'Please select a blood group'),
    maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed'], { required_error: 'Please select marital status' }),
    fathersName: z.string().min(2, "Father's Name is required").trim(),
    mothersName: z.string().min(2, "Mother's Name is required").trim(),
  }),
  familyDetails: z.object({
    fathersOccupation: z.string().optional().or(z.literal('')),
    fathersMobile: z.string().regex(/^[0-9]{10}$/, 'Enter valid 10-digit mobile number').optional().or(z.literal('')),
    mothersOccupation: z.string().optional().or(z.literal('')),
    mothersMobile: z.string().regex(/^[0-9]{10}$/, 'Enter valid 10-digit mobile number').optional().or(z.literal('')),
    spouseName: z.string().optional().or(z.literal('')),
    marriageDate: z.string().optional().or(z.literal('')),
    numberOfChildren: z.coerce.number().min(0).optional().default(0),
  }).default({}),
  contactDetails: z.object({
    mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number').trim(),
    alternativeMobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number').optional().or(z.literal('')),
    email: z.string().email('Enter a valid email address').trim().toLowerCase(),
    alternativeEmail: z.string().email('Enter a valid alternative email').optional().or(z.literal('')),
  }),
  addressDetails: z.object({
    permanentAddress: addressSchema,
    temporaryAddress: addressSchema,
    sameAsPermanent: z.boolean().default(false),
  }),
  educationDetails: z.object({
    highestQualification: z.string().min(2, 'Educational qualification is required').trim(),
    institutionName: z.string().min(2, 'School / College name is required').trim(),
    additionalQualification: z.string().optional().or(z.literal('')),
    passingYear: z.string().regex(/^(19|20)\d{2}$/, 'Enter a valid passing year (e.g. 2022)').trim(),
    percentageOrGrade: z.string().optional().or(z.literal('')),
  }),
  employmentDetails: z.object({
    hasPreviousExperience: z.boolean().default(false),
    previousOccupation: z.string().optional().or(z.literal('')),
    previousCompanyName: z.string().optional().or(z.literal('')),
    experienceDurationYears: z.coerce.number().min(0).optional().default(0),
    experienceDurationMonths: z.coerce.number().min(0).max(11).optional().default(0),
    lastDrawnSalary: z.string().optional().or(z.literal('')),
    reasonForLeaving: z.string().optional().or(z.literal('')),
  }).default({ hasPreviousExperience: false }),
  preferredJobRole: z.enum(
    ['GOLD', 'NIDHI', 'MFI', 'CHIT', 'INSURANCE'],
    { required_error: 'Please select your preferred job role' }
  ),
  referenceDetails: z.object({
    referralSource: z.enum(['Walk-in Direct', 'Friend', 'Reference', 'Advertisement', 'Other'], {
      required_error: 'Please specify how you heard about Rupeeapex',
    }),
    referrerName: z.string().optional().or(z.literal('')),
    referrerContact: z.string().optional().or(z.literal('')),
    additionalRemarks: z.string().optional().or(z.literal('')),
  }),
  declarationAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the declaration to submit your application' }),
  }),
});

export type CandidateApplicationInput = z.infer<typeof candidateApplicationSchema>;

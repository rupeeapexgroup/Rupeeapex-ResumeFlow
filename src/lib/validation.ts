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
  doorNoStreet: z.string().min(1, 'Door Number / Street is required').trim(),
  villageOrArea: z.string().min(1, 'Village / Area is required').trim(),
  taluk: z.string().min(1, 'Taluk is required').trim(),
  district: z.string().min(1, 'District is required').trim(),
  state: z.string().min(1, 'State is required').trim(),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN Code').trim(),
});

export const candidateApplicationSchema = z
  .object({
    personalDetails: z.object({
      fullName: z.string().min(2, 'Candidate Name is required (min 2 characters)').trim(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Date of Birth is required'),
      age: z.coerce.number().min(18, 'Minimum age is 18 years').max(70, 'Age must be 70 or below'),
      gender: z.enum(['Male', 'Female'], { required_error: 'Please select gender' }),
      bloodGroup: z.string().optional().or(z.literal('')),
      maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed'], { required_error: 'Please select marital status' }),
      fathersName: z.string().min(2, "Father's Name is required").trim(),
      mothersName: z.string().min(2, "Mother's Name is required").trim(),
      spouseName: z.string().optional().or(z.literal('')),
      mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian Mobile Number').trim(),
      alternativeMobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Alternative Mobile').optional().or(z.literal('')),
      email: z.string().email('Enter a valid Email Address').trim().toLowerCase(),
      aadhaarNumber: z.string().regex(/^\d{12}$/, 'Enter a valid 12-digit Aadhaar Number').trim(),
      panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'Enter a valid 10-character PAN Number (e.g. ABCDE1234F)').trim().toUpperCase(),
    }),
    familyDetails: z.object({
      fathersOccupation: z.string().optional().or(z.literal('')),
      fathersMobile: z.string().regex(/^[0-9]{10}$/, 'Enter valid 10-digit mobile number').optional().or(z.literal('')),
      mothersOccupation: z.string().optional().or(z.literal('')),
      mothersMobile: z.string().regex(/^[0-9]{10}$/, 'Enter valid 10-digit mobile number').optional().or(z.literal('')),
      spouseOccupation: z.string().optional().or(z.literal('')),
      spouseName: z.string().optional().or(z.literal('')),
      marriageDate: z.string().optional().or(z.literal('')),
      numberOfChildren: z.coerce.number().min(0).optional().default(0),
    }).default({}),
    addressDetails: z.object({
      permanentAddress: addressSchema,
      temporaryAddress: addressSchema,
      sameAsPermanent: z.boolean().default(false),
    }),
    educationDetails: z.object({
      highestQualification: z.string().min(2, 'Highest Educational Qualification is required').trim(),
      educationDetails: z.string().optional().or(z.literal('')),
      institutionName: z.string().min(2, 'Institution Name is required').trim(),
      passingYear: z.string().regex(/^(19|20)\d{2}$/, 'Enter a valid Year of Passing (e.g. 2022)').trim(),
      additionalQualification: z.string().optional().or(z.literal('')),
      percentageOrGrade: z.string().optional().or(z.literal('')),
    }),
    employmentDetails: z.object({
      hasPreviousExperience: z.boolean().default(false),
      previousCompany: z.string().optional().or(z.literal('')),
      previousDesignation: z.string().optional().or(z.literal('')),
      yearsOfExperience: z.coerce.number().min(0).optional().default(0),
      previousCompany2: z.string().optional().or(z.literal('')),
      previousDesignation2: z.string().optional().or(z.literal('')),
      yearsOfExperience2: z.coerce.number().min(0).optional().default(0),
      previousCompany3: z.string().optional().or(z.literal('')),
      previousDesignation3: z.string().optional().or(z.literal('')),
      yearsOfExperience3: z.coerce.number().min(0).optional().default(0),
      previousOccupation: z.string().optional().or(z.literal('')),
      previousCompanyName: z.string().optional().or(z.literal('')),
      experienceDurationYears: z.coerce.number().min(0).optional().default(0),
      experienceDurationMonths: z.coerce.number().min(0).max(11).optional().default(0),
      lastDrawnSalary: z.string().optional().or(z.literal('')),
      reasonForLeaving: z.string().optional().or(z.literal('')),
      previouslyWorkedHere: z.boolean().default(false),
      previousEmployeeId: z.string().optional().or(z.literal('')),
      previousBranch: z.string().optional().or(z.literal('')),
      relievingYear: z.string().optional().or(z.literal('')),
      joinDesignation: z.string().optional().or(z.literal('')),
      relievingDesignation: z.string().optional().or(z.literal('')),
      dateOfRelieving: z.string().optional().or(z.literal('')),
      reasonForRelieving: z.string().optional().or(z.literal('')),
    }).default({ hasPreviousExperience: false }),
    preferredJobRole: z.enum(
      ['GOLD', 'NIDHI', 'MFI', 'CHIT', 'INSURANCE', 'OTHER'],
      { required_error: 'Please select your PREFERRED JOB ROLE' }
    ),
    preferredJobRoleOther: z.string().optional().or(z.literal('')),
    referenceDetails: z.object({
      referralSource: z.enum(['Walk-in Direct', 'Friend', 'Reference', 'Advertisement', 'Other'], {
        required_error: 'Please specify how you came to know about this job',
      }),
      referrerName: z.string().optional().or(z.literal('')),
      referrerContact: z.string().optional().or(z.literal('')),
      additionalRemarks: z.string().optional().or(z.literal('')),
    }),
    declarationAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the candidate declaration to submit your application' }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.preferredJobRole === 'OTHER') {
      if (!data.preferredJobRoleOther || data.preferredJobRoleOther.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please specify your preferred job role',
          path: ['preferredJobRoleOther'],
        });
      }
    }

    if (data.employmentDetails?.previouslyWorkedHere) {
      if (!data.employmentDetails.joinDesignation || !data.employmentDetails.joinDesignation.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Joining Designation at Rupeeapex is required',
          path: ['employmentDetails', 'joinDesignation'],
        });
      }
      if (!data.employmentDetails.relievingDesignation || !data.employmentDetails.relievingDesignation.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Relieving Designation at Rupeeapex is required',
          path: ['employmentDetails', 'relievingDesignation'],
        });
      }
      if (!data.employmentDetails.reasonForRelieving || !data.employmentDetails.reasonForRelieving.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Reason for Relieving from Rupeeapex is required',
          path: ['employmentDetails', 'reasonForRelieving'],
        });
      }
    }
  });

export type CandidateApplicationInput = z.infer<typeof candidateApplicationSchema>;

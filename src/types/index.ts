export type PreferredJobRole = 'GOLD' | 'NIDHI' | 'MFI' | 'CHIT' | 'INSURANCE';

export type ApplicationStatus = 'NEW' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';

export interface PersonalDetails {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  fathersName: string;
  mothersName: string;
}

export interface FamilyDetails {
  fathersOccupation?: string;
  fathersMobile?: string;
  mothersOccupation?: string;
  mothersMobile?: string;
  spouseName?: string;
  marriageDate?: string;
  numberOfChildren?: number;
  dependentCount?: number;
}

export interface ContactDetails {
  mobileNumber: string;
  alternativeMobileNumber?: string;
  email: string;
  alternativeEmail?: string;
}

export interface AddressDetails {
  permanentAddress: {
    doorNoStreet: string;
    villageOrArea: string;
    taluk: string;
    district: string;
    state: string;
    pincode: string;
  };
  temporaryAddress: {
    doorNoStreet: string;
    villageOrArea: string;
    taluk: string;
    district: string;
    state: string;
    pincode: string;
  };
  sameAsPermanent?: boolean;
}

export interface EducationDetails {
  highestQualification: string;
  institutionName: string;
  additionalQualification?: string;
  passingYear: string;
  percentageOrGrade?: string;
}

export interface EmploymentDetails {
  hasPreviousExperience: boolean;
  previousOccupation?: string;
  previousCompanyName?: string;
  experienceDurationYears?: number;
  experienceDurationMonths?: number;
  lastDrawnSalary?: string;
  reasonForLeaving?: string;
}

export interface ReferenceDetails {
  referralSource: 'Walk-in Direct' | 'Friend' | 'Reference' | 'Advertisement' | 'Other';
  referrerName?: string;
  referrerContact?: string;
  additionalRemarks?: string;
}

export interface CandidateRecord {
  _id?: string;
  applicationId: string;
  personalDetails: PersonalDetails;
  familyDetails: FamilyDetails;
  contactDetails: ContactDetails;
  addressDetails: AddressDetails;
  educationDetails: EducationDetails;
  employmentDetails: EmploymentDetails;
  preferredJobRole: PreferredJobRole;
  referenceDetails: ReferenceDetails;
  photographStorageKey: string;
  photographFileName?: string;
  photographMimeType?: string;
  applicationStatus: ApplicationStatus;
  statusNotes?: string;
  submittedAt: Date | string;
  updatedAt: Date | string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'HR_ADMIN';
  isActive: boolean;
}

export interface DashboardStats {
  total: number;
  new: number;
  underReview: number;
  shortlisted: number;
  rejected: number;
  selected: number;
  roleCounts: Record<PreferredJobRole, number>;
}

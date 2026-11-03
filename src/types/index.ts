export type PreferredJobRole = 'GOLD' | 'NIDHI' | 'MFI' | 'CHIT' | 'INSURANCE' | 'OTHER';

export type ApplicationStatus = 'NEW' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';

export interface PersonalDetails {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  fathersName: string;
  mothersName: string;
  spouseName?: string;
  mobileNumber: string;
  alternativeMobileNumber?: string;
  email: string;
  aadhaarNumber: string; // 12-digit Aadhaar number
  panNumber: string;     // 10-character PAN number
}

export interface FamilyDetails {
  fathersOccupation?: string;
  fathersMobile?: string;
  mothersOccupation?: string;
  mothersMobile?: string;
  spouseOccupation?: string;
  spouseName?: string;
  marriageDate?: string;
  numberOfChildren?: number;
}

export interface AddressUnit {
  doorNoStreet: string;
  villageOrArea: string;
  taluk: string;
  district: string;
  state: string;
  pincode: string;
}

export interface AddressDetails {
  permanentAddress: AddressUnit;
  temporaryAddress: AddressUnit;
  sameAsPermanent?: boolean;
}

export interface EducationDetails {
  highestQualification: string;
  educationDetails?: string; // Specialization / course details
  institutionName: string;
  passingYear: string;
  percentageOrGrade?: string;
  additionalQualification?: string;
}

export interface EmploymentDetails {
  hasPreviousExperience: boolean;
  previousCompany?: string;
  previousDesignation?: string;
  yearsOfExperience?: number;
  experienceDurationYears?: number;
  experienceDurationMonths?: number;
  lastDrawnSalary?: string;
  reasonForLeaving?: string;
  previousOccupation?: string;
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
  addressDetails: AddressDetails;
  educationDetails: EducationDetails;
  employmentDetails: EmploymentDetails;
  preferredJobRole: PreferredJobRole;
  preferredJobRoleOther?: string;
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
  today: number;
  new: number;
  underReview: number;
  shortlisted: number;
  rejected: number;
  selected: number;
  roleCounts: Record<PreferredJobRole, number>;
}

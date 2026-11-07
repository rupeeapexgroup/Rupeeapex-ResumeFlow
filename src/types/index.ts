export type PreferredJobRole = 'GOLD' | 'NIDHI' | 'MFI' | 'CHIT' | 'INSURANCE' | 'OTHER';

export type ApplicationStatus = 'NEW' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';

export interface PersonalDetails {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  gender: 'Male' | 'Female';
  bloodGroup?: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  fathersName: string;
  mothersName: string;
  spouseName?: string;
  mobileNumber: string;
  alternativeMobileNumber?: string;
  email: string;
  aadhaarNumber: string; // 12-digit Aadhaar number
  panNumber?: string;            // 10-character PAN number (optional)
  drivingLicenseNumber?: string; // Driving License Number (optional)
  bankAccountNumber?: string;   // Bank Account Number (optional)
  ifscCode?: string;             // IFSC Code (optional)
  bankBranchName?: string;       // Bank and Branch Name (optional)
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
  previousCompanyName?: string;
  previousDesignation?: string;
  yearsOfExperience?: number;
  previousCompany2?: string;
  previousDesignation2?: string;
  yearsOfExperience2?: number;
  previousCompany3?: string;
  previousDesignation3?: string;
  yearsOfExperience3?: number;
  experienceDurationYears?: number;
  experienceDurationMonths?: number;
  lastDrawnSalary?: string;
  reasonForLeaving?: string;
  previousOccupation?: string;
  previouslyWorkedHere?: boolean;
  previousEmployeeId?: string;
  previousBranch?: string;
  relievingYear?: string;
  joinDesignation?: string;
  relievingDesignation?: string;
  dateOfRelieving?: string;
  reasonForRelieving?: string;
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
  contactDetails?: any;
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
  isExEmployee?: boolean;
  isRepeatApplicant?: boolean;
  previousApplicationId?: string;
  previousApplicationsCount?: number;
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
  genderCounts: {
    male: number;
    female: number;
  };
}

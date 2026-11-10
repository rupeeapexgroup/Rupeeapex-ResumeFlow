import * as XLSX from 'xlsx';
import { connectToDatabase } from '@/lib/mongodb';
import { Candidate } from '@/models/Candidate';
import { CandidateFilterParams } from '@/services/candidateService';

function formatAddress(addr?: any): string {
  if (!addr) return '';
  const parts = [
    addr.doorNoStreet,
    addr.villageOrArea,
    addr.taluk,
    addr.district,
    addr.state,
    addr.pincode ? `PIN: ${addr.pincode}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

function formatDate(d?: any): string {
  if (!d) return '';
  try {
    const date = new Date(d);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(d);
  }
}

export async function exportCandidatesToExcel(params: CandidateFilterParams): Promise<Buffer> {
  await connectToDatabase();

  const query: any = {};

  // Search filter
  if (params.search && params.search.trim()) {
    const term = params.search.trim();
    const regex = new RegExp(term, 'i');
    query.$or = [
      { applicationId: regex },
      { 'personalDetails.fullName': regex },
      { 'personalDetails.mobileNumber': regex },
      { 'personalDetails.email': regex },
      { 'personalDetails.aadhaarNumber': regex },
      { 'personalDetails.panNumber': regex },
      { 'personalDetails.drivingLicenseNumber': regex },
      { 'contactDetails.mobileNumber': regex },
    ];
  }

  // Role filter
  if (params.role && params.role !== 'ALL') {
    query.preferredJobRole = params.role;
  }

  // Status filter
  if (params.status && params.status !== 'ALL') {
    query.applicationStatus = params.status;
  }

  // Education filter
  if (params.education && params.education !== 'ALL') {
    query['educationDetails.highestQualification'] = new RegExp(params.education.trim(), 'i');
  }

  // Applicant type filter
  if (params.applicantType && params.applicantType !== 'ALL') {
    if (params.applicantType === 'EX_EMPLOYEE') {
      query.isExEmployee = true;
    } else if (params.applicantType === 'REPEAT') {
      query.isRepeatApplicant = true;
      query.isExEmployee = { $ne: true };
    } else if (params.applicantType === 'NEW') {
      query.isRepeatApplicant = { $ne: true };
      query.isExEmployee = { $ne: true };
    }
  }

  // Experience filter
  if (params.experience && params.experience !== 'ALL') {
    if (params.experience === 'fresher') {
      query['employmentDetails.hasPreviousExperience'] = false;
    } else if (params.experience === 'experienced') {
      query['employmentDetails.hasPreviousExperience'] = true;
    } else if (params.experience === '1-3') {
      query['employmentDetails.hasPreviousExperience'] = true;
      query['employmentDetails.yearsOfExperience'] = { $gte: 1, $lte: 3 };
    } else if (params.experience === '3+') {
      query['employmentDetails.hasPreviousExperience'] = true;
      query['employmentDetails.yearsOfExperience'] = { $gt: 3 };
    }
  }

  // Age group filter
  if (params.ageRange && params.ageRange !== 'ALL') {
    if (params.ageRange === '18-25') {
      query['personalDetails.age'] = { $gte: 18, $lte: 25 };
    } else if (params.ageRange === '26-35') {
      query['personalDetails.age'] = { $gte: 26, $lte: 35 };
    } else if (params.ageRange === '36+') {
      query['personalDetails.age'] = { $gt: 35 };
    }
  }

  // Gender filter
  if (params.gender && params.gender !== 'ALL') {
    query['personalDetails.gender'] = params.gender;
  }

  // Date range filter
  const now = new Date();
  if (params.dateRange === 'today') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    query.submittedAt = { $gte: startOfDay };
  } else if (params.dateRange === '7days') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    query.submittedAt = { $gte: sevenDaysAgo };
  } else if (params.dateRange === '30days') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    query.submittedAt = { $gte: thirtyDaysAgo };
  } else if (params.startDate || params.endDate) {
    const dateQuery: any = {};
    if (params.startDate) {
      dateQuery.$gte = new Date(params.startDate);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    query.submittedAt = dateQuery;
  }

  // Fetch all matching candidates (up to 5000)
  const candidates: any[] = await Candidate.find(query)
    .sort({ submittedAt: -1 })
    .limit(5000)
    .lean();

  // Map to clean Excel spreadsheet row objects
  const excelRows = candidates.map((c, index) => {
    const p = c.personalDetails || {};
    const fam = c.familyDetails || {};
    const edu = c.educationDetails || {};
    const emp = c.employmentDetails || {};
    const addr = c.addressDetails || {};

    let applicantTypeLabel = 'New Applicant';
    if (c.isExEmployee) applicantTypeLabel = 'Ex-Employee';
    else if (c.isRepeatApplicant) applicantTypeLabel = 'Repeat Applicant';

    return {
      'S.No': index + 1,
      'Application ID': c.applicationId || 'N/A',
      'Application Date': formatDate(c.submittedAt),
      'Status': c.applicationStatus || 'NEW',
      'Candidate Name': p.fullName || '',
      'Mobile Number': p.mobileNumber || c.contactDetails?.mobileNumber || '',
      'Alternative Mobile': p.alternativeMobileNumber || '',
      'Email Address': p.email || '',
      'Gender': p.gender || '',
      'Date of Birth': p.dateOfBirth || '',
      'Age': p.age || '',
      'Blood Group': p.bloodGroup || '',
      'Marital Status': p.maritalStatus || '',
      'Father Name': fam.fathersName || p.fathersName || '',
      'Father Mobile': fam.fathersMobile || '',
      'Mother Name': fam.mothersName || p.mothersName || '',
      'Mother Mobile': fam.mothersMobile || '',
      'Spouse Name': fam.spouseName || p.spouseName || '',
      'Aadhaar Number': p.aadhaarNumber || '',
      'PAN Number': p.panNumber || '',
      'Driving License': p.drivingLicenseNumber || '',
      'Bank Account No': p.bankAccountNumber || '',
      'IFSC Code': p.ifscCode || '',
      'Bank Branch': p.bankBranchName || '',
      'Permanent Address': formatAddress(addr.permanentAddress),
      'Temporary Address': formatAddress(addr.temporaryAddress),
      'Highest Qualification': edu.highestQualification || '',
      'Institution Name': edu.institutionName || '',
      'Passing Year': edu.passingYear || '',
      'Percentage / Grade': edu.percentageOrGrade || '',
      'Additional Qualification': edu.additionalQualification || '',
      'Experience Status': emp.hasPreviousExperience ? 'Experienced' : 'Fresher',
      'Total Experience (Years)': emp.yearsOfExperience || (emp.hasPreviousExperience ? 'Yes' : 0),
      'Previous Company': emp.previousCompany || emp.previousCompanyName || '',
      'Previous Designation': emp.previousDesignation || emp.previousOccupation || '',
      'Preferred Job Role': c.preferredJobRole || '',
      'Other Role Specified': c.preferredJobRoleOther || '',
      'Preferred Location': c.preferredJobLocation || '',
      'Expected Salary': c.expectedSalary || '',
      'Notice Period': c.noticePeriod || '',
      'Applicant Type': applicantTypeLabel,
      'System Remarks': c.statusNotes || '',
    };
  });

  // Create Excel workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(excelRows);

  // Set column widths for readability
  const colWidths = [
    { wch: 6 },  // S.No
    { wch: 18 }, // Application ID
    { wch: 20 }, // Application Date
    { wch: 15 }, // Status
    { wch: 25 }, // Candidate Name
    { wch: 15 }, // Mobile Number
    { wch: 18 }, // Alternative Mobile
    { wch: 25 }, // Email Address
    { wch: 10 }, // Gender
    { wch: 14 }, // Date of Birth
    { wch: 8 },  // Age
    { wch: 12 }, // Blood Group
    { wch: 14 }, // Marital Status
    { wch: 22 }, // Father Name
    { wch: 15 }, // Father Mobile
    { wch: 22 }, // Mother Name
    { wch: 15 }, // Mother Mobile
    { wch: 22 }, // Spouse Name
    { wch: 16 }, // Aadhaar Number
    { wch: 14 }, // PAN Number
    { wch: 18 }, // Driving License
    { wch: 20 }, // Bank Account No
    { wch: 14 }, // IFSC Code
    { wch: 20 }, // Bank Branch
    { wch: 35 }, // Permanent Address
    { wch: 35 }, // Temporary Address
    { wch: 22 }, // Highest Qualification
    { wch: 25 }, // Institution Name
    { wch: 14 }, // Passing Year
    { wch: 18 }, // Percentage / Grade
    { wch: 25 }, // Additional Qualification
    { wch: 18 }, // Experience Status
    { wch: 22 }, // Total Experience (Years)
    { wch: 25 }, // Previous Company
    { wch: 22 }, // Previous Designation
    { wch: 22 }, // Preferred Job Role
    { wch: 22 }, // Other Role Specified
    { wch: 20 }, // Preferred Location
    { wch: 16 }, // Expected Salary
    { wch: 15 }, // Notice Period
    { wch: 18 }, // Applicant Type
    { wch: 30 }, // System Remarks
  ];

  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

  // Write as buffer
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
}

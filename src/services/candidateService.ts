import { connectToDatabase } from '@/lib/mongodb';
import { Candidate, ICandidate } from '@/models/Candidate';
import { getNextApplicationId } from '@/models/Counter';
import { saveCandidatePhotograph } from '@/lib/storage';
import { CandidateApplicationInput } from '@/lib/validation';
import { DashboardStats, PreferredJobRole, ApplicationStatus, CandidateRecord } from '@/types';

export interface CandidateFilterParams {
  search?: string;
  role?: string;
  status?: string;
  education?: string;
  experience?: string; // 'ALL' | 'experienced' | 'fresher'
  applicantType?: string; // 'ALL' | 'NEW' | 'EX_EMPLOYEE' | 'REPEAT'
  ageRange?: string; // 'ALL' | 'under-21' | '21-25' | '26-30' | '31-35' | '36+'
  gender?: string; // 'ALL' | 'Male' | 'Female'
  dateRange?: string; // 'today' | '7days' | '30days' | 'custom'
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function submitApplication(
  data: CandidateApplicationInput,
  photoBuffer: Buffer,
  photoOriginalName: string
): Promise<{ applicationId: string; candidateId: string }> {
  await connectToDatabase();

  // 1. Save photo to private storage
  const { storageKey, mimeType } = await saveCandidatePhotograph(photoBuffer, photoOriginalName);

  // 2. Generate unique atomic Application ID
  const applicationId = await getNextApplicationId();

  // 3. Normalize address if "sameAsPermanent" is selected
  const temporaryAddress = data.addressDetails.sameAsPermanent
    ? { ...data.addressDetails.permanentAddress }
    : data.addressDetails.temporaryAddress;

  // 4. Automated background check for previous applications by PAN or Aadhaar
  const pan = (data.personalDetails.panNumber || '').toUpperCase().trim();
  const aadhaar = (data.personalDetails.aadhaarNumber || '').trim();

  const matchConditions: any[] = [{ 'personalDetails.aadhaarNumber': aadhaar }];
  if (pan) {
    matchConditions.push({ 'personalDetails.panNumber': pan });
  }

  const previousApplications = await Candidate.find({
    $or: matchConditions,
  }).sort({ submittedAt: -1 }).lean();

  const hadPreviousEmployment = previousApplications.some(
    (app) => app.applicationStatus === 'SELECTED'
  );

  const isExEmployee = Boolean(
    data.employmentDetails?.previouslyWorkedHere || hadPreviousEmployment
  );

  const isRepeatApplicant = previousApplications.length > 0;
  const previousApplicationId = previousApplications.length > 0 ? previousApplications[0].applicationId : undefined;
  const previousApplicationsCount = previousApplications.length;

  // 5. Save Candidate record in MongoDB
  const candidate = await Candidate.create({
    applicationId,
    personalDetails: {
      ...data.personalDetails,
      panNumber: data.personalDetails.panNumber ? data.personalDetails.panNumber.toUpperCase().trim() : '',
      drivingLicenseNumber: data.personalDetails.drivingLicenseNumber ? data.personalDetails.drivingLicenseNumber.toUpperCase().trim() : '',
      bloodGroup: data.personalDetails.bloodGroup || '',
      bankAccountNumber: data.personalDetails.bankAccountNumber ? data.personalDetails.bankAccountNumber.trim() : '',
      ifscCode: data.personalDetails.ifscCode ? data.personalDetails.ifscCode.toUpperCase().trim() : '',
      bankBranchName: data.personalDetails.bankBranchName ? data.personalDetails.bankBranchName.trim() : '',
    },
    familyDetails: data.familyDetails,
    contactDetails: {
      mobileNumber: data.personalDetails.mobileNumber,
      alternativeMobileNumber: data.personalDetails.alternativeMobileNumber,
      email: data.personalDetails.email,
    },
    addressDetails: {
      permanentAddress: data.addressDetails.permanentAddress,
      temporaryAddress,
      sameAsPermanent: data.addressDetails.sameAsPermanent,
    },
    educationDetails: data.educationDetails,
    employmentDetails: data.employmentDetails,
    preferredJobRole: data.preferredJobRole,
    preferredJobRoleOther: data.preferredJobRole === 'OTHER' ? data.preferredJobRoleOther : undefined,
    referenceDetails: data.referenceDetails,
    photographStorageKey: storageKey,
    photographFileName: photoOriginalName,
    photographMimeType: mimeType,
    applicationStatus: 'NEW',
    isExEmployee,
    isRepeatApplicant,
    previousApplicationId,
    previousApplicationsCount,
    submittedAt: new Date(),
  });

  return {
    applicationId: candidate.applicationId,
    candidateId: candidate._id.toString(),
  };
}

export async function getCandidates(params: CandidateFilterParams) {
  await connectToDatabase();

  const query: any = {};

  // Search filter (Application ID, Candidate Name, Mobile Number, Aadhaar, PAN)
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
    if (params.experience === 'experienced') {
      query['employmentDetails.hasPreviousExperience'] = true;
    } else if (params.experience === 'fresher') {
      query['employmentDetails.hasPreviousExperience'] = false;
    }
  }

  // Age Range filter
  if (params.ageRange && params.ageRange !== 'ALL') {
    if (params.ageRange === 'under-21') {
      query['personalDetails.age'] = { $lt: 21 };
    } else if (params.ageRange === '21-25') {
      query['personalDetails.age'] = { $gte: 21, $lte: 25 };
    } else if (params.ageRange === '26-30') {
      query['personalDetails.age'] = { $gte: 26, $lte: 30 };
    } else if (params.ageRange === '31-35') {
      query['personalDetails.age'] = { $gte: 31, $lte: 35 };
    } else if (params.ageRange === '36+') {
      query['personalDetails.age'] = { $gte: 36 };
    }
  }

  // Gender filter
  if (params.gender && params.gender !== 'ALL') {
    query['personalDetails.gender'] = params.gender;
  }

  // Date filters
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

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
  const skip = (page - 1) * limit;

  let sortField = 'submittedAt';
  let sortDir: 1 | -1 = -1;

  if (params.sortBy) {
    if (params.sortBy === 'name') sortField = 'personalDetails.fullName';
    else if (params.sortBy === 'applicationId') sortField = 'applicationId';
    else if (params.sortBy === 'role') sortField = 'preferredJobRole';
    else if (params.sortBy === 'status') sortField = 'applicationStatus';
    else sortField = params.sortBy;
  }

  if (params.sortOrder === 'asc') {
    sortDir = 1;
  }

  const [candidates, totalCount] = await Promise.all([
    Candidate.find(query)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),
    Candidate.countDocuments(query),
  ]);

  return {
    candidates: (candidates as any[]).map((c) => ({
      ...c,
      _id: String(c._id),
      submittedAt: c.submittedAt ? new Date(c.submittedAt).toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
    })),
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
}

export async function getCandidateById(idOrAppId: string): Promise<CandidateRecord | null> {
  await connectToDatabase();

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrAppId);
  const query = isObjectId
    ? { $or: [{ _id: idOrAppId }, { applicationId: idOrAppId }] }
    : { applicationId: idOrAppId };

  const candidate = await Candidate.findOne(query).lean();
  if (!candidate) return null;

  return {
    ...(candidate as any),
    _id: String((candidate as any)._id),
    submittedAt: (candidate as any).submittedAt ? new Date((candidate as any).submittedAt).toISOString() : new Date().toISOString(),
    updatedAt: (candidate as any).updatedAt ? new Date((candidate as any).updatedAt).toISOString() : new Date().toISOString(),
  } as unknown as CandidateRecord;
}

export async function updateCandidateStatus(
  idOrAppId: string,
  status: ApplicationStatus,
  notes?: string
): Promise<CandidateRecord | null> {
  await connectToDatabase();

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrAppId);
  const query = isObjectId
    ? { $or: [{ _id: idOrAppId }, { applicationId: idOrAppId }] }
    : { applicationId: idOrAppId };

  const update: any = {
    applicationStatus: status,
    updatedAt: new Date(),
  };

  if (notes !== undefined) {
    update.statusNotes = notes;
  }

  const updated = await Candidate.findOneAndUpdate(query, update, { new: true }).lean();
  if (!updated) return null;

  return {
    ...(updated as any),
    _id: String((updated as any)._id),
  } as unknown as CandidateRecord;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectToDatabase();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [total, todayCount, statusCounts, roleCountsAgg, genderCountsAgg] = await Promise.all([
    Candidate.countDocuments({}),
    Candidate.countDocuments({ submittedAt: { $gte: startOfToday } }),
    Candidate.aggregate([
      {
        $group: {
          _id: '$applicationStatus',
          count: { $sum: 1 },
        },
      },
    ]),
    Candidate.aggregate([
      {
        $group: {
          _id: '$preferredJobRole',
          count: { $sum: 1 },
        },
      },
    ]),
    Candidate.aggregate([
      {
        $group: {
          _id: '$personalDetails.gender',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const stats: DashboardStats = {
    total,
    today: todayCount,
    new: 0,
    underReview: 0,
    shortlisted: 0,
    rejected: 0,
    selected: 0,
    roleCounts: {
      GOLD: 0,
      NIDHI: 0,
      MFI: 0,
      CHIT: 0,
      INSURANCE: 0,
      OTHER: 0,
    },
    genderCounts: {
      male: 0,
      female: 0,
    },
  };

  statusCounts.forEach((s) => {
    if (s._id === 'NEW') stats.new = s.count;
    else if (s._id === 'UNDER_REVIEW') stats.underReview = s.count;
    else if (s._id === 'SHORTLISTED') stats.shortlisted = s.count;
    else if (s._id === 'REJECTED') stats.rejected = s.count;
    else if (s._id === 'SELECTED') stats.selected = s.count;
  });

  roleCountsAgg.forEach((r) => {
    if (['GOLD', 'NIDHI', 'MFI', 'CHIT', 'INSURANCE', 'OTHER'].includes(r._id)) {
      stats.roleCounts[r._id as PreferredJobRole] = r.count;
    }
  });

  genderCountsAgg.forEach((g) => {
    if (g._id === 'Male') stats.genderCounts.male = g.count;
    else if (g._id === 'Female') stats.genderCounts.female = g.count;
  });

  return stats;
}

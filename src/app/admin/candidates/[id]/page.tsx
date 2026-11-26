'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { APPLICATION_STATUSES } from '@/lib/constants';
import { formatDateOfBirth, formatPanNumber, formatNil } from '@/lib/formatters';
import {
  ArrowLeft,
  Download,
  Eye,
  Calendar,
  Phone,
  Mail,
  Home,
  GraduationCap,
  Briefcase,
  Building2,
  History,
  Users,
  User,
  Star,
  CheckCircle2,
  Clock,
  Save,
  AlertCircle,
  FileText,
  CreditCard,
  Shield,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status edit state
  const [currentStatus, setCurrentStatus] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteCandidate = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete candidate application.');
      }

      router.push('/admin/candidates');
    } catch (err: any) {
      setDeleteError(err?.message || 'Error deleting candidate application.');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function loadCandidate() {
      setLoading(true);
      try {
        const res = await fetch(`/api/candidates/${candidateId}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Candidate not found');
        }
        const data = await res.json();
        setCandidate(data.candidate);
        setCurrentStatus(data.candidate.applicationStatus);
        setNotes(data.candidate.statusNotes || '');
      } catch (err: any) {
        setError(err.message || 'Error loading candidate details');
      } finally {
        setLoading(false);
      }
    }
    loadCandidate();
  }, [candidateId, router]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStatus(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationStatus: currentStatus,
          statusNotes: notes,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert('Failed to update status');
      }
    } catch {
      alert('Error connecting to server');
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 lg:pl-64 flex items-center justify-center p-8">
          <div className="text-slate-500 text-sm flex items-center gap-2">
            <Clock className="w-5 h-5 animate-spin text-[#006B3C]" />
            <span>Loading candidate profile...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 lg:pl-64 p-8">
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 mb-1">Candidate Not Found</h2>
            <p className="text-xs text-slate-500 mb-4">{error}</p>
            <Link
              href="/admin/candidates"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#006B3C] text-white text-xs font-semibold rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Candidates</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const roleDisplay = candidate.preferredJobRole === 'OTHER' && candidate.preferredJobRoleOther
    ? `OTHER: ${candidate.preferredJobRoleOther}`
    : candidate.preferredJobRole;

  const statusObj = APPLICATION_STATUSES.find((s) => s.value === currentStatus);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 lg:pl-64 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/candidates"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">
                  {candidate.personalDetails.fullName}
                </h1>
                <span className="font-mono text-xs font-extrabold text-[#006B3C] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {candidate.applicationId}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Submitted on{' '}
                {new Date(candidate.submittedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {candidate.photographStorageKey && (
              <a
                href={`/api/candidates/${candidate._id}/photo?download=true`}
                download={`Candidate_${candidate.applicationId}_Photo.jpg`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-sm"
                title="Download Candidate Photo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Photo</span>
              </a>
            )}

            {candidate.resumeStorageKey && (
              <a
                href={`/api/candidates/${candidate._id}/resume?download=true`}
                download={candidate.resumeFileName || `Candidate_${candidate.applicationId}_Resume.pdf`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006B3C] border border-emerald-200 text-xs font-semibold rounded-xl transition-colors shadow-sm"
                title="Download Candidate Resume"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Resume</span>
              </a>
            )}

            <a
              href={`/api/candidates/${candidate._id}/pdf`}
              download={`Candidate_${candidate.applicationId}.pdf`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#006B3C] hover:bg-[#005530] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </a>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-xl transition-colors shadow-sm"
              title="Delete Candidate Application"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-w-6xl w-full">
          {/* Top Quick Status & Preferred Role Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Candidate Photograph */}
              <div className="w-24 h-28 rounded-xl bg-slate-100 border-2 border-emerald-600 overflow-hidden relative shadow-sm shrink-0 flex items-center justify-center">
                {candidate.photographStorageKey ? (
                  <img
                    src={`/api/candidates/${candidate._id}/photo`}
                    alt={candidate.personalDetails.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Preferred Job Role
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                  <span>{roleDisplay}</span>
                </div>
                {candidate.preferredJobRole === 'OTHER' && candidate.preferredJobRoleOther && (
                  <div className="text-xs text-amber-800 font-semibold mt-0.5">
                    Specified Custom Role: &quot;{candidate.preferredJobRoleOther}&quot;
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      statusObj?.color || 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    Status: {statusObj?.label || currentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Status Update Form */}
            <form
              onSubmit={handleUpdateStatus}
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-end gap-3"
            >
              <div className="w-full sm:w-auto">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Update Application Status
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label} ({s.value})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={savingStatus}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#006B3C] hover:bg-[#005530] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingStatus ? 'Saving...' : 'Update'}</span>
              </button>
            </form>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Status updated successfully.</span>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Section 1: Personal Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100 mb-3">
                <User className="w-4 h-4 text-[#006B3C]" />
                <span>Personal Details</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <dt className="text-slate-400">Candidate Name</dt>
                  <dd className="font-semibold text-slate-900">{formatNil(candidate.personalDetails?.fullName)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Gender</dt>
                  <dd className="font-semibold text-slate-900">{formatNil(candidate.personalDetails?.gender)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Date of Birth</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatDateOfBirth(candidate.personalDetails?.dateOfBirth)}
                    {candidate.personalDetails?.age ? ` (${candidate.personalDetails.age} yrs)` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Marital Status</dt>
                  <dd className="font-semibold text-slate-900">{formatNil(candidate.personalDetails?.maritalStatus)}</dd>
                </div>
                {candidate.personalDetails?.marriageDate && (
                  <div>
                    <dt className="text-slate-400">Marriage Date</dt>
                    <dd className="font-semibold text-slate-900">
                      {formatDateOfBirth(candidate.personalDetails.marriageDate)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-400">Father&apos;s Name</dt>
                  <dd className="font-semibold text-slate-900">{formatNil(candidate.personalDetails?.fathersName)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Mother&apos;s Name</dt>
                  <dd className="font-semibold text-slate-900">{formatNil(candidate.personalDetails?.mothersName)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Spouse Name</dt>
                  <dd className="font-semibold text-slate-900">{formatNil(candidate.personalDetails?.spouseName)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Mobile Number</dt>
                  <dd className="font-semibold text-[#006B3C]">{formatNil(candidate.personalDetails?.mobileNumber)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Alt Mobile</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.personalDetails?.alternativeMobileNumber)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Email Address</dt>
                  <dd className="font-semibold text-slate-900">{formatNil(candidate.personalDetails?.email)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Aadhaar Number</dt>
                  <dd className="font-mono font-semibold text-slate-900">{formatNil(candidate.personalDetails?.aadhaarNumber)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">PAN Number</dt>
                  <dd className="font-mono font-semibold uppercase text-slate-900">{formatPanNumber(candidate.personalDetails?.panNumber)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Driving License No</dt>
                  <dd className="font-mono font-semibold uppercase text-slate-900">{formatNil(candidate.personalDetails?.drivingLicenseNumber)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Blood Group</dt>
                  <dd className="font-semibold text-slate-900">{formatNil(candidate.personalDetails?.bloodGroup)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Bank Account No</dt>
                  <dd className="font-mono font-semibold text-slate-900">{formatNil(candidate.personalDetails?.bankAccountNumber)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">IFSC Code</dt>
                  <dd className="font-mono font-semibold uppercase text-slate-900">{formatNil(candidate.personalDetails?.ifscCode)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Bank & Branch Name</dt>
                  <dd className="font-semibold text-slate-900">{formatNil(candidate.personalDetails?.bankBranchName)}</dd>
                </div>
              </dl>
            </div>

            {/* Section 2: Family Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100 mb-3">
                <Users className="w-4 h-4 text-[#006B3C]" />
                <span>Family Details</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <dt className="text-slate-400">Father&apos;s Occupation</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.familyDetails?.fathersOccupation)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Father&apos;s Mobile</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.familyDetails?.fathersMobile)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Mother&apos;s Occupation</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.familyDetails?.mothersOccupation)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Mother&apos;s Mobile</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.familyDetails?.mothersMobile)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Spouse Occupation</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.familyDetails?.spouseOccupation)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Spouse Mobile</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.familyDetails?.spouseMobile)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Section 3: Education Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100 mb-3">
                <GraduationCap className="w-4 h-4 text-[#006B3C]" />
                <span>Education Details</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <dt className="text-slate-400">Highest Qualification</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.educationDetails?.highestQualification)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Year of Passing</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.educationDetails?.passingYear)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Institution Name</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.educationDetails?.institutionName)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Education Details / Specialization</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatNil(candidate.educationDetails?.educationDetails)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Section 4: Experience Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100 mb-3">
                <Briefcase className="w-4 h-4 text-[#006B3C]" />
                <span>Experience Details</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <dt className="text-slate-400">Experience Status</dt>
                  <dd className="font-semibold text-slate-900">
                    {candidate.employmentDetails?.hasPreviousExperience ? 'Experienced' : 'Fresher'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Worked at Rupeeapex Before?</dt>
                  <dd className="font-semibold text-slate-900">
                    {candidate.isExEmployee || candidate.employmentDetails?.previouslyWorkedHere ? (
                      <span className="text-emerald-700 font-bold">Yes (Ex-Employee)</span>
                    ) : (
                      'No'
                    )}
                  </dd>
                </div>
                {candidate.employmentDetails?.previouslyWorkedHere && (
                  <>
                    <div>
                      <dt className="text-slate-400">Rupeeapex Employee ID</dt>
                      <dd className="font-semibold text-slate-900">{formatNil(candidate.employmentDetails?.previousEmployeeId)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Rupeeapex Joining Designation</dt>
                      <dd className="font-semibold text-slate-900">{formatNil(candidate.employmentDetails?.joinDesignation)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Rupeeapex Relieving Designation</dt>
                      <dd className="font-semibold text-slate-900">{formatNil(candidate.employmentDetails?.relievingDesignation)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Date of Relieving</dt>
                      <dd className="font-semibold text-slate-900">{formatNil(candidate.employmentDetails?.dateOfRelieving)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-400">Reason for Relieving</dt>
                      <dd className="font-semibold text-slate-900">{formatNil(candidate.employmentDetails?.reasonForRelieving)}</dd>
                    </div>
                  </>
                )}
                {candidate.employmentDetails?.hasPreviousExperience ? (
                  <>
                    <div>
                      <dt className="text-slate-400">Years of Experience</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatNil(candidate.employmentDetails?.yearsOfExperience || candidate.employmentDetails?.experienceDurationYears)} Years
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Previous Company</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatNil(candidate.employmentDetails?.previousCompany || candidate.employmentDetails?.previousCompanyName)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Previous Designation</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatNil(candidate.employmentDetails?.previousDesignation || candidate.employmentDetails?.previousOccupation)}
                      </dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt className="text-slate-400">Years of Experience</dt>
                      <dd className="font-semibold text-slate-900">NIL</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Previous Company</dt>
                      <dd className="font-semibold text-slate-900">NIL</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Previous Designation</dt>
                      <dd className="font-semibold text-slate-900">NIL</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          </div>

          {/* Section 5: Preferred Job Role */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100 mb-3">
              <Star className="w-4 h-4 text-[#006B3C]" />
              <span>Preferred Job Role</span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-slate-400">Selected Role</dt>
                <dd className="font-bold text-slate-900 text-sm">{formatNil(roleDisplay)}</dd>
              </div>
              {candidate.preferredJobRole === 'OTHER' && (
                <div>
                  <dt className="text-slate-400">Specified Custom Role</dt>
                  <dd className="font-semibold text-amber-800 text-sm">{formatNil(candidate.preferredJobRoleOther)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Section 6: Other Details & Reference */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100 mb-3">
              <FileText className="w-4 h-4 text-[#006B3C]" />
              <span>Other Details & Reference</span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <dt className="text-slate-400">How did you come to know about this job?</dt>
                <dd className="font-semibold text-slate-900">
                  {formatNil(candidate.referenceDetails?.referralSource)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Reference Name</dt>
                <dd className="font-semibold text-slate-900">
                  {formatNil(candidate.referenceDetails?.referrerName)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Additional Relevant Details</dt>
                <dd className="font-semibold text-slate-900">
                  {formatNil(candidate.referenceDetails?.additionalRemarks)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Section 7: Address Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100 mb-3">
              <Home className="w-4 h-4 text-[#006B3C]" />
              <span>Address Information</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Permanent Address:</span>
                <p className="text-slate-800 leading-relaxed">
                  {candidate.addressDetails?.permanentAddress ? (
                    <>
                      {formatNil(candidate.addressDetails.permanentAddress.doorNoStreet)},{' '}
                      {formatNil(candidate.addressDetails.permanentAddress.villageOrArea)},{' '}
                      {formatNil(candidate.addressDetails.permanentAddress.taluk)},{' '}
                      {formatNil(candidate.addressDetails.permanentAddress.district)},{' '}
                      {formatNil(candidate.addressDetails.permanentAddress.state)} -{' '}
                      <span className="font-semibold font-mono">
                        {formatNil(candidate.addressDetails.permanentAddress.pincode)}
                      </span>
                    </>
                  ) : (
                    'NIL'
                  )}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">
                  Temporary / Present Address:
                </span>
                <p className="text-slate-800 leading-relaxed">
                  {candidate.addressDetails?.sameAsPermanent
                    ? 'Same as Permanent Address'
                    : candidate.addressDetails?.temporaryAddress
                    ? (
                      <>
                        {formatNil(candidate.addressDetails.temporaryAddress.doorNoStreet)},{' '}
                        {formatNil(candidate.addressDetails.temporaryAddress.villageOrArea)},{' '}
                        {formatNil(candidate.addressDetails.temporaryAddress.taluk)},{' '}
                        {formatNil(candidate.addressDetails.temporaryAddress.district)},{' '}
                        {formatNil(candidate.addressDetails.temporaryAddress.state)} -{' '}
                        <span className="font-semibold font-mono">
                          {formatNil(candidate.addressDetails.temporaryAddress.pincode)}
                        </span>
                      </>
                    )
                    : 'NIL'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 8: Candidate Resume / CV */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <FileText className="w-4 h-4 text-[#006B3C]" />
                <span>Candidate Resume / CV</span>
              </div>
              {candidate.resumeStorageKey ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#006B3C] border border-emerald-200">
                  Uploaded
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  Legacy / Not Available
                </span>
              )}
            </div>

            {candidate.resumeStorageKey ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006B3C] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate" title={candidate.resumeFileName || 'Resume Document'}>
                      {candidate.resumeFileName || 'Resume Document'}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{candidate.resumeMimeType || 'Document'}</span>
                      {candidate.resumeFileSize && (
                        <>
                          <span>•</span>
                          <span>{(candidate.resumeFileSize / (1024 * 1024)).toFixed(2)} MB</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/api/candidates/${candidate._id}/resume`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:border-[#006B3C] hover:text-[#006B3C] text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Resume</span>
                  </a>
                  <a
                    href={`/api/candidates/${candidate._id}/resume?download=true`}
                    download={candidate.resumeFileName || `Candidate_${candidate.applicationId}_Resume.pdf`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#006B3C] hover:bg-[#005530] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Resume Document:</span>
                <span className="text-xs font-bold text-slate-600 bg-slate-200/80 px-3 py-1 rounded-md">
                  NIL
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Delete Candidate Application
                    </h3>
                    <p className="text-xs text-slate-500">
                      Permanent Record Deletion
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-xs text-slate-500">Candidate:</div>
                  <div className="text-sm font-bold text-slate-900">
                    {candidate.personalDetails.fullName}
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#006B3C]">
                    {candidate.applicationId}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Are you sure you want to permanently delete this candidate application?
                </p>

                {deleteError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    {deleteError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteCandidate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isDeleting ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

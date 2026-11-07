'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { APPLICATION_STATUSES } from '@/lib/constants';
import {
  ArrowLeft,
  Download,
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

          <div className="flex items-center gap-2.5">
            <a
              href={`/api/candidates/${candidate._id}/pdf`}
              download={`Candidate_${candidate.applicationId}.pdf`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#006B3C] hover:bg-[#005530] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </a>
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
                  <dd className="font-semibold text-slate-900">{candidate.personalDetails.fullName}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Gender</dt>
                  <dd className="font-semibold text-slate-900">{candidate.personalDetails.gender}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Date of Birth</dt>
                  <dd className="font-semibold text-slate-900">
                    {candidate.personalDetails.dateOfBirth} ({candidate.personalDetails.age} yrs)
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Marital Status</dt>
                  <dd className="font-semibold text-slate-900">{candidate.personalDetails.maritalStatus}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Father&apos;s Name</dt>
                  <dd className="font-semibold text-slate-900">{candidate.personalDetails.fathersName}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Mother&apos;s Name</dt>
                  <dd className="font-semibold text-slate-900">{candidate.personalDetails.mothersName}</dd>
                </div>
                {candidate.personalDetails.spouseName && (
                  <div>
                    <dt className="text-slate-400">Spouse Name</dt>
                    <dd className="font-semibold text-slate-900">{candidate.personalDetails.spouseName}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-400">Mobile Number</dt>
                  <dd className="font-semibold text-[#006B3C]">{candidate.personalDetails.mobileNumber}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Alt Mobile</dt>
                  <dd className="font-semibold text-slate-900">
                    {candidate.personalDetails.alternativeMobileNumber || 'N/A'}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Email Address</dt>
                  <dd className="font-semibold text-slate-900">{candidate.personalDetails.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Aadhaar Number</dt>
                  <dd className="font-mono font-semibold text-slate-900">{candidate.personalDetails.aadhaarNumber}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">PAN Number</dt>
                  <dd className="font-mono font-semibold uppercase text-slate-900">{candidate.personalDetails.panNumber || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Driving License No</dt>
                  <dd className="font-mono font-semibold uppercase text-slate-900">{candidate.personalDetails.drivingLicenseNumber || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Blood Group</dt>
                  <dd className="font-semibold text-slate-900">{candidate.personalDetails.bloodGroup || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Bank Account No</dt>
                  <dd className="font-mono font-semibold text-slate-900">{candidate.personalDetails.bankAccountNumber || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">IFSC Code</dt>
                  <dd className="font-mono font-semibold uppercase text-slate-900">{candidate.personalDetails.ifscCode || 'N/A'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Bank & Branch Name</dt>
                  <dd className="font-semibold text-slate-900">{candidate.personalDetails.bankBranchName || 'N/A'}</dd>
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
                    {candidate.familyDetails?.fathersOccupation || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Father&apos;s Mobile</dt>
                  <dd className="font-semibold text-slate-900">
                    {candidate.familyDetails?.fathersMobile || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Mother&apos;s Occupation</dt>
                  <dd className="font-semibold text-slate-900">
                    {candidate.familyDetails?.mothersOccupation || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Mother&apos;s Mobile</dt>
                  <dd className="font-semibold text-slate-900">
                    {candidate.familyDetails?.mothersMobile || 'N/A'}
                  </dd>
                </div>
                {candidate.familyDetails?.spouseOccupation && (
                  <div>
                    <dt className="text-slate-400">Spouse Occupation</dt>
                    <dd className="font-semibold text-slate-900">
                      {candidate.familyDetails.spouseOccupation}
                    </dd>
                  </div>
                )}
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
                    {candidate.educationDetails.highestQualification}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Year of Passing</dt>
                  <dd className="font-semibold text-slate-900">
                    {candidate.educationDetails.passingYear}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Institution Name</dt>
                  <dd className="font-semibold text-slate-900">
                    {candidate.educationDetails.institutionName}
                  </dd>
                </div>
                {candidate.educationDetails.educationDetails && (
                  <div className="col-span-2">
                    <dt className="text-slate-400">Education Details / Specialization</dt>
                    <dd className="font-semibold text-slate-900">
                      {candidate.educationDetails.educationDetails}
                    </dd>
                  </div>
                )}
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
                    {candidate.employmentDetails.hasPreviousExperience ? 'Experienced' : 'Fresher'}
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
                    {candidate.employmentDetails.previousEmployeeId && (
                      <div>
                        <dt className="text-slate-400">Rupeeapex Employee ID</dt>
                        <dd className="font-semibold text-slate-900">{candidate.employmentDetails.previousEmployeeId}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-slate-400">Rupeeapex Joining Designation</dt>
                      <dd className="font-semibold text-slate-900">{candidate.employmentDetails.joinDesignation || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Rupeeapex Relieving Designation</dt>
                      <dd className="font-semibold text-slate-900">{candidate.employmentDetails.relievingDesignation || 'N/A'}</dd>
                    </div>
                    {candidate.employmentDetails.dateOfRelieving && (
                      <div>
                        <dt className="text-slate-400">Date of Relieving</dt>
                        <dd className="font-semibold text-slate-900">{candidate.employmentDetails.dateOfRelieving}</dd>
                      </div>
                    )}
                    <div className="col-span-2">
                      <dt className="text-slate-400">Reason for Relieving</dt>
                      <dd className="font-semibold text-slate-900">{candidate.employmentDetails.reasonForRelieving || 'N/A'}</dd>
                    </div>
                  </>
                )}
                {candidate.employmentDetails.hasPreviousExperience && (
                  <>
                    <div>
                      <dt className="text-slate-400">Years of Experience</dt>
                      <dd className="font-semibold text-slate-900">
                        {candidate.employmentDetails.yearsOfExperience || candidate.employmentDetails.experienceDurationYears || 0} Years
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Previous Company</dt>
                      <dd className="font-semibold text-slate-900">
                        {candidate.employmentDetails.previousCompany || candidate.employmentDetails.previousCompanyName || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Previous Designation</dt>
                      <dd className="font-semibold text-slate-900">
                        {candidate.employmentDetails.previousDesignation || candidate.employmentDetails.previousOccupation || 'N/A'}
                      </dd>
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
                <dd className="font-bold text-slate-900 text-sm">{roleDisplay}</dd>
              </div>
              {candidate.preferredJobRole === 'OTHER' && candidate.preferredJobRoleOther && (
                <div>
                  <dt className="text-slate-400">Specified Custom Role</dt>
                  <dd className="font-semibold text-amber-800 text-sm">{candidate.preferredJobRoleOther}</dd>
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
                  {candidate.referenceDetails.referralSource}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Reference Name</dt>
                <dd className="font-semibold text-slate-900">
                  {candidate.referenceDetails.referrerName || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Additional Relevant Details</dt>
                <dd className="font-semibold text-slate-900">
                  {candidate.referenceDetails.additionalRemarks || 'None'}
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
                  {candidate.addressDetails.permanentAddress.doorNoStreet},{' '}
                  {candidate.addressDetails.permanentAddress.villageOrArea},{' '}
                  {candidate.addressDetails.permanentAddress.taluk},{' '}
                  {candidate.addressDetails.permanentAddress.district},{' '}
                  {candidate.addressDetails.permanentAddress.state} -{' '}
                  <span className="font-semibold font-mono">
                    {candidate.addressDetails.permanentAddress.pincode}
                  </span>
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">
                  Temporary / Present Address:
                </span>
                <p className="text-slate-800 leading-relaxed">
                  {candidate.addressDetails.sameAsPermanent
                    ? 'Same as Permanent Address'
                    : `${candidate.addressDetails.temporaryAddress.doorNoStreet}, ${candidate.addressDetails.temporaryAddress.villageOrArea}, ${candidate.addressDetails.temporaryAddress.taluk}, ${candidate.addressDetails.temporaryAddress.district}, ${candidate.addressDetails.temporaryAddress.state} - ${candidate.addressDetails.temporaryAddress.pincode}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

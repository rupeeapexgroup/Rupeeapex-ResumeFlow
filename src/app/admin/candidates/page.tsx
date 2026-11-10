'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { PREFERRED_JOB_ROLES, EDUCATION_QUALIFICATIONS } from '@/lib/constants';
import {
  Search,
  Download,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedEducation, setSelectedEducation] = useState('ALL');
  const [selectedExperience, setSelectedExperience] = useState('ALL');
  const [applicantType, setApplicantType] = useState('ALL');
  const [selectedAge, setSelectedAge] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Deletion states
  const [candidateToDelete, setCandidateToDelete] = useState<{
    id: string;
    applicationId: string;
    fullName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!candidateToDelete) return;
    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const res = await fetch(`/api/candidates/${candidateToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete candidate application.');
      }

      setCandidateToDelete(null);
      setDeleteSuccessMessage('Candidate application deleted successfully.');
      setTimeout(() => setDeleteSuccessMessage(null), 5000);
      // Refresh candidate list
      fetchCandidates(pagination.page);
    } catch (err: any) {
      setDeleteErrorMessage(err?.message || 'An error occurred while deleting candidate.');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchCandidates = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageToLoad));
      params.set('limit', '10');

      if (search.trim()) params.set('search', search.trim());
      if (selectedRole !== 'ALL') params.set('role', selectedRole);
      if (selectedEducation !== 'ALL') params.set('education', selectedEducation);
      if (selectedExperience !== 'ALL') params.set('experience', selectedExperience);
      if (applicantType !== 'ALL') params.set('applicantType', applicantType);
      if (selectedAge !== 'ALL') params.set('ageRange', selectedAge);
      if (selectedGender !== 'ALL') params.set('gender', selectedGender);

      if (dateRange !== 'ALL') {
        if (dateRange === 'custom') {
          if (startDate) params.set('startDate', startDate);
          if (endDate) params.set('endDate', endDate);
        } else {
          params.set('dateRange', dateRange);
        }
      }

      const res = await fetch(`/api/candidates?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch');
      }

      const data = await res.json();
      setCandidates(data.candidates || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedRole, selectedEducation, selectedExperience, applicantType, selectedAge, selectedGender, dateRange, startDate, endDate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roleParam = urlParams.get('role');
      const genderParam = urlParams.get('gender');
      if (roleParam) setSelectedRole(roleParam);
      if (genderParam) setSelectedGender(genderParam);
    }
  }, []);

  useEffect(() => {
    fetchCandidates(1);
  }, [fetchCandidates]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedRole('ALL');
    setSelectedEducation('ALL');
    setSelectedExperience('ALL');
    setApplicantType('ALL');
    setSelectedAge('ALL');
    setSelectedGender('ALL');
    setDateRange('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedRole !== 'ALL') params.set('role', selectedRole);
      if (selectedEducation !== 'ALL') params.set('education', selectedEducation);
      if (selectedExperience !== 'ALL') params.set('experience', selectedExperience);
      if (applicantType !== 'ALL') params.set('applicantType', applicantType);
      if (selectedAge !== 'ALL') params.set('ageRange', selectedAge);
      if (selectedGender !== 'ALL') params.set('gender', selectedGender);

      if (dateRange !== 'ALL') {
        if (dateRange === 'custom') {
          if (startDate) params.set('startDate', startDate);
          if (endDate) params.set('endDate', endDate);
        } else {
          params.set('dateRange', dateRange);
        }
      }

      const res = await fetch(`/api/candidates/export?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to export Excel file');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rupeeapex_Candidates_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export candidates to Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 lg:pl-64 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Candidate Applications</h1>
            <p className="text-xs text-slate-500">
              Filter by role, education, experience, and application date
            </p>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#006B3C] hover:bg-[#005530] disabled:bg-emerald-300 text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:cursor-not-allowed"
              title="Export all matching candidates to Excel (.xlsx)"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${isExporting ? 'animate-spin' : ''}`} />
              <span>{isExporting ? 'Exporting...' : 'Export Excel'}</span>
            </button>

            <button
              onClick={() => fetchCandidates(pagination.page)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl w-full">
          {/* Deletion Success Banner */}
          {deleteSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs text-emerald-800 animate-fadeIn shadow-sm">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#006B3C] shrink-0" />
                <span>{deleteSuccessMessage}</span>
              </div>
              <button
                onClick={() => setDeleteSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search & Filter Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by Candidate Name, Mobile Number, Application ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#006B3C] hover:bg-[#005530] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                Search
              </button>
            </form>

            {/* Filter Controls Row */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Role filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Preferred Job Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="ALL">All Roles (Any)</option>
                  {PREFERRED_JOB_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Education filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Education
                </label>
                <select
                  value={selectedEducation}
                  onChange={(e) => setSelectedEducation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="ALL">All Qualifications</option>
                  {EDUCATION_QUALIFICATIONS.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Experience
                </label>
                <select
                  value={selectedExperience}
                  onChange={(e) => setSelectedExperience(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="ALL">All Candidates</option>
                  <option value="experienced">Experienced Only</option>
                  <option value="fresher">Fresher Only</option>
                </select>
              </div>

              {/* Applicant Type filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Applicant Type
                </label>
                <select
                  value={applicantType}
                  onChange={(e) => setApplicantType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="ALL">All Applicants</option>
                  <option value="NEW">New Applicants Only</option>
                  <option value="EX_EMPLOYEE">Ex-Employees / Re-Hires</option>
                  <option value="REPEAT">Repeat Applicants</option>
                </select>
              </div>

              {/* Age Range Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Age Group
                </label>
                <select
                  value={selectedAge}
                  onChange={(e) => setSelectedAge(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="ALL">All Ages (Any)</option>
                  <option value="under-21">Under 21 Yrs</option>
                  <option value="21-25">21 - 25 Yrs</option>
                  <option value="26-30">26 - 30 Yrs</option>
                  <option value="31-35">31 - 35 Yrs</option>
                  <option value="36+">36+ Yrs</option>
                </select>
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="ALL">All Genders</option>
                  <option value="Male">Male Candidates</option>
                  <option value="Female">Female Candidates</option>
                </select>
              </div>

              {/* Date Range filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Application Date
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="ALL">All Dates</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {/* Clear filters button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full py-2 px-3 border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Custom Date Inputs */}
            {dateRange === 'custom' && (
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span>
              Showing <strong className="text-slate-900">{candidates.length}</strong> of{' '}
              <strong className="text-slate-900">{pagination.total}</strong> candidate records
            </span>
            {pagination.totalPages > 1 && (
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
            )}
          </div>

          {/* Candidate Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3.5">Application ID</th>
                    <th className="px-4 py-3.5">Candidate Name</th>
                    <th className="px-4 py-3.5">Mobile Number</th>
                    <th className="px-4 py-3.5">Education</th>
                    <th className="px-4 py-3.5">Experience</th>
                    <th className="px-4 py-3.5">Preferred Job Role</th>
                    <th className="px-4 py-3.5">Application Date</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-[#006B3C]" />
                          <span>Loading candidate applications...</span>
                        </div>
                      </td>
                    </tr>
                  ) : candidates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        No candidate applications found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    candidates.map((candidate) => {
                      const roleDisplay = candidate.preferredJobRole === 'OTHER' && candidate.preferredJobRoleOther
                        ? `OTHER (${candidate.preferredJobRoleOther})`
                        : candidate.preferredJobRole;

                      const expDisplay = candidate.employmentDetails?.hasPreviousExperience
                        ? `${candidate.employmentDetails.yearsOfExperience || candidate.employmentDetails.experienceDurationYears || 1} Yrs`
                        : 'Fresher';

                      return (
                        <tr key={candidate._id} className="hover:bg-slate-50 transition-colors">
                          {/* ID */}
                          <td className="px-4 py-3.5 font-mono font-bold text-[#006B3C]">
                            <Link
                              href={`/admin/candidates/${candidate._id}`}
                              className="hover:underline"
                            >
                              {candidate.applicationId}
                            </Link>
                          </td>

                          {/* Name + Photo */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {candidate.photographStorageKey ? (
                                  <img
                                    src={`/api/candidates/${candidate._id}/photo`}
                                    alt={candidate.personalDetails.fullName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[11px] font-bold text-slate-500">
                                    {candidate.personalDetails.fullName?.charAt(0) || 'C'}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-slate-900">
                                {candidate.personalDetails.fullName}
                              </span>
                            </div>
                          </td>

                          {/* Mobile */}
                          <td className="px-4 py-3.5 text-slate-600">
                            {candidate.personalDetails.mobileNumber}
                          </td>

                          {/* Education */}
                          <td className="px-4 py-3.5 text-slate-600">
                            {candidate.educationDetails.highestQualification}
                          </td>

                          {/* Experience */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                candidate.employmentDetails?.hasPreviousExperience
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {expDisplay}
                            </span>
                          </td>

                          {/* Preferred Role */}
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-1 text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 rounded-md">
                              {roleDisplay}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                            {new Date(candidate.submittedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Actions: View Details, Download PDF, Delete */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <Link
                                href={`/admin/candidates/${candidate._id}`}
                                title="View Details"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-[#006B3C] hover:text-white rounded-lg text-slate-700 font-medium transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </Link>

                              <a
                                href={`/api/candidates/${candidate._id}/pdf`}
                                download={`Candidate_${candidate.applicationId}.pdf`}
                                title="Download PDF"
                                className="p-1.5 text-slate-600 hover:text-[#006B3C] hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>

                              <button
                                type="button"
                                onClick={() =>
                                  setCandidateToDelete({
                                    id: candidate._id,
                                    applicationId: candidate.applicationId,
                                    fullName: candidate.personalDetails.fullName,
                                  })
                                }
                                title="Delete Candidate Application"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchCandidates(pagination.page - 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <span className="text-slate-600">
                  Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchCandidates(pagination.page + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {candidateToDelete && (
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
                    {candidateToDelete.fullName}
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#006B3C]">
                    {candidateToDelete.applicationId}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Are you sure you want to permanently delete this candidate application?
                </p>

                {deleteErrorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    {deleteErrorMessage}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setCandidateToDelete(null);
                    setDeleteErrorMessage(null);
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
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

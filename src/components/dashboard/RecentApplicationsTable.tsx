'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  User,
} from 'lucide-react';

interface RecentApplicationsTableProps {
  initialCandidates: any[];
}

export function RecentApplicationsTable({ initialCandidates }: RecentApplicationsTableProps) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<any[]>(initialCandidates);
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

      // Remove candidate from local list
      setCandidates((prev) => prev.filter((c) => c._id !== candidateToDelete.id));
      setCandidateToDelete(null);
      setDeleteSuccessMessage('Candidate application deleted successfully.');
      setTimeout(() => setDeleteSuccessMessage(null), 5000);
      router.refresh();
    } catch (err: any) {
      setDeleteErrorMessage(err?.message || 'An error occurred while deleting candidate.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Deletion Success Banner */}
      {deleteSuccessMessage && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
            <tr>
              <th className="px-5 py-3.5">Application ID</th>
              <th className="px-5 py-3.5">Candidate Name</th>
              <th className="px-5 py-3.5">Mobile Number</th>
              <th className="px-5 py-3.5">Education</th>
              <th className="px-5 py-3.5">Experience</th>
              <th className="px-5 py-3.5">Preferred Job Role</th>
              <th className="px-5 py-3.5">Application Date</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                  No candidate applications submitted yet.
                </td>
              </tr>
            ) : (
              candidates.map((c: any) => {
                const roleDisplay =
                  c.preferredJobRole === 'OTHER' && c.preferredJobRoleOther
                    ? `OTHER (${c.preferredJobRoleOther})`
                    : c.preferredJobRole;

                const expDisplay = c.employmentDetails?.hasPreviousExperience
                  ? `${c.employmentDetails.yearsOfExperience || c.employmentDetails.experienceDurationYears || 1} Yrs`
                  : 'Fresher';

                return (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#006B3C]">
                      <Link href={`/admin/candidates/${c._id}`} className="hover:underline">
                        {c.applicationId}
                      </Link>
                    </td>

                    {/* Candidate Name with photo avatar thumbnail */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {c.photographStorageKey ? (
                            <img
                              src={`/api/candidates/${c._id}/photo`}
                              alt={c.personalDetails.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[11px] font-bold text-slate-500">
                              {c.personalDetails.fullName?.charAt(0) || 'C'}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-slate-900">
                          {c.personalDetails.fullName}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600">
                      {c.personalDetails.mobileNumber}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {c.educationDetails.highestQualification}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          c.employmentDetails?.hasPreviousExperience
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {expDisplay}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 rounded-md">
                        {roleDisplay}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(c.submittedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/admin/candidates/${c._id}`}
                          title="View Complete Application Details"
                          className="p-1.5 text-slate-600 hover:text-[#006B3C] hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <a
                          href={`/api/candidates/${c._id}/pdf`}
                          download={`Candidate_${c.applicationId}.pdf`}
                          title="Download Official Application PDF"
                          className="p-1.5 text-slate-600 hover:text-[#006B3C] hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setCandidateToDelete({
                              id: c._id,
                              applicationId: c.applicationId,
                              fullName: c.personalDetails.fullName,
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
    </div>
  );
}


import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getDashboardStats, getCandidates } from '@/services/candidateService';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import {
  Users,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Award,
  ArrowRight,
  Search,
  Eye,
  Download,
  QrCode,
  FileCheck2,
} from 'lucide-react';
import { PREFERRED_JOB_ROLES, APPLICATION_STATUSES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [stats, recentCandidatesData] = await Promise.all([
    getDashboardStats(),
    getCandidates({ limit: 10, sortBy: 'submittedAt', sortOrder: 'desc' }),
  ]);

  const recentCandidates = recentCandidatesData.candidates;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <AdminSidebar currentUsername={session.username} />

      <main className="flex-1 lg:pl-64 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-slate-900">HR Recruitment Dashboard</h1>
            <p className="text-xs text-slate-500">
              Rupeeapex Groups of Companies • Live Candidate Statistics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/qr/reception-poster.pdf"
              download="Rupeeapex_Reception_Poster_A4.pdf"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-xl transition-colors shadow-sm"
              title="Print Reception A4 Poster for Reception Desk"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-700" />
              <span>Print Reception Poster</span>
            </a>
            <Link
              href="/admin/candidates"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#006B3C] hover:bg-[#005530] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Candidates</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6 space-y-8 max-w-7xl w-full">
          {/* 1. Summary Cards */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Application Summary
              </h2>
              <span className="text-xs text-slate-400">Live data from MongoDB</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Total Applications */}
              <div className="p-5 rounded-2xl border border-blue-200 bg-white shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Total Applications
                  </span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">{stats.total}</div>
                <div className="text-[11px] text-slate-500 mt-1">All time received</div>
              </div>

              {/* Today's Applications */}
              <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#006B3C]">
                    Today&apos;s Applications
                  </span>
                  <Calendar className="w-4 h-4 text-[#006B3C]" />
                </div>
                <div className="text-3xl font-black text-[#006B3C]">{stats.today}</div>
                <div className="text-[11px] text-emerald-700 mt-1 font-medium">Submitted today</div>
              </div>

              {/* Shortlisted */}
              <div className="p-5 rounded-2xl border border-purple-200 bg-white shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Shortlisted
                  </span>
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">{stats.shortlisted}</div>
                <div className="text-[11px] text-slate-500 mt-1">Ready for interview</div>
              </div>

              {/* Selected */}
              <div className="p-5 rounded-2xl border border-green-200 bg-white shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Selected
                  </span>
                  <UserCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">{stats.selected}</div>
                <div className="text-[11px] text-slate-500 mt-1">Hired candidates</div>
              </div>
            </div>
          </section>

          {/* 2. Applications by Preferred Job Role */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Applications by Preferred Job Role
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Breakdown across all 6 roles including specified custom entries
                </p>
              </div>
              <Link
                href="/admin/candidates"
                className="text-xs font-semibold text-[#006B3C] hover:underline inline-flex items-center gap-1"
              >
                <span>Filter Candidates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PREFERRED_JOB_ROLES.map((role) => {
                const count = stats.roleCounts[role] || 0;
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <Link
                    key={role}
                    href={`/admin/candidates?role=${role}`}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-[#006B3C] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900 group-hover:text-[#006B3C]">
                        {role}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {percentage}%
                      </span>
                    </div>
                    <div className="text-xl font-black text-slate-800 mt-1">{count}</div>
                    <div className="text-[10px] text-slate-500">applicants</div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 3. Candidate Management Table */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recent Applications
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest candidate submissions received through the common reception QR code
                </p>
              </div>
              <Link
                href="/admin/candidates"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006B3C] hover:text-[#005530]"
              >
                <span>Open Full Management Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

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
                  {recentCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                        No candidate applications submitted yet.
                      </td>
                    </tr>
                  ) : (
                    recentCandidates.map((c: any) => {
                      const roleDisplay = c.preferredJobRole === 'OTHER' && c.preferredJobRoleOther
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
                          <td className="px-5 py-3.5 font-semibold text-slate-900">
                            {c.personalDetails.fullName}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {c.personalDetails.mobileNumber}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {c.educationDetails.highestQualification}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${c.employmentDetails?.hasPreviousExperience ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
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
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

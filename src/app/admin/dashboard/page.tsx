import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getDashboardStats, getCandidates } from '@/services/candidateService';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import {
  Users,
  FileCheck2,
  Clock,
  UserCheck,
  UserX,
  Award,
  ArrowRight,
  Search,
  Filter,
  Eye,
  Calendar,
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
    getCandidates({ limit: 5, sortBy: 'submittedAt', sortOrder: 'desc' }),
  ]);

  const recentCandidates = recentCandidatesData.candidates;

  const statCards = [
    {
      label: 'Total Applications',
      count: stats.total,
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeColor: 'bg-blue-600',
    },
    {
      label: 'New Applications',
      count: stats.new,
      icon: FileCheck2,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      badgeColor: 'bg-sky-600',
    },
    {
      label: 'Under Review',
      count: stats.underReview,
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeColor: 'bg-amber-600',
    },
    {
      label: 'Shortlisted',
      count: stats.shortlisted,
      icon: Award,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      badgeColor: 'bg-purple-600',
    },
    {
      label: 'Selected',
      count: stats.selected,
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeColor: 'bg-emerald-600',
    },
    {
      label: 'Rejected',
      count: stats.rejected,
      icon: UserX,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      badgeColor: 'bg-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <AdminSidebar currentUsername={session.username} />

      {/* Main Content Area */}
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
          {/* 1. Statistics Cards Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Application Pipeline Overview
              </h2>
              <span className="text-xs text-slate-400">Real-time counts from MongoDB</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className={`p-4 rounded-2xl border ${card.color} bg-white shadow-sm flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        {card.label}
                      </span>
                      <Icon className="w-4 h-4 opacity-70" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {card.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Role-wise Application Breakdown (Section 5 Requirement) */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Role-Wise Application Breakdown
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applications categorized by candidate preferred division
                </p>
              </div>
              <Link
                href="/admin/candidates"
                className="text-xs font-semibold text-[#006B3C] hover:underline inline-flex items-center gap-1"
              >
                <span>Filter by Role</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {PREFERRED_JOB_ROLES.map((role) => {
                const count = stats.roleCounts[role] || 0;
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <Link
                    key={role}
                    href={`/admin/candidates?role=${role}`}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-[#006B3C] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-[#006B3C]">
                        {role}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                        {percentage}%
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-2">{count}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">applications</div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 3. Recent Applications Table */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Recent Applications
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest candidate submissions received via reception QR code
                </p>
              </div>
              <Link
                href="/admin/candidates"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006B3C] hover:text-[#005530]"
              >
                <span>View All Candidates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Application ID</th>
                    <th className="px-5 py-3.5">Candidate Name</th>
                    <th className="px-5 py-3.5">Mobile</th>
                    <th className="px-5 py-3.5">Preferred Role</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        No candidate applications submitted yet. Applications will appear here once candidates scan the reception QR code.
                      </td>
                    </tr>
                  ) : (
                    recentCandidates.map((c: any) => {
                      const statusObj = APPLICATION_STATUSES.find((s) => s.value === c.applicationStatus);
                      return (
                        <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-[#006B3C]">
                            {c.applicationId}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-900">
                            {c.personalDetails.fullName}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {c.contactDetails.mobileNumber}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 rounded-md">
                              {c.preferredJobRole}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            {new Date(c.submittedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                statusObj?.color || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {statusObj?.label || c.applicationStatus}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              href={`/admin/candidates/${c._id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-[#006B3C] hover:text-white rounded-lg text-slate-700 font-medium transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Link>
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

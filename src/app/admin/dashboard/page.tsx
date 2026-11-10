import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getDashboardStats, getCandidates } from '@/services/candidateService';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { RecentApplicationsTable } from '@/components/dashboard/RecentApplicationsTable';
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
              Rupeeapex Group of Companies • Live Candidate Statistics
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

            {/* Gender-wise Distribution Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Link
                href="/admin/candidates?gender=Male"
                className="p-5 rounded-2xl border border-sky-200 bg-white hover:border-sky-400 hover:shadow-md transition-all shadow-sm flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 group-hover:text-sky-700">
                      Male Applicants
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {stats.genderCounts.male}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    {stats.total > 0 ? Math.round((stats.genderCounts.male / stats.total) * 100) : 0}% of total candidates
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold text-xl group-hover:bg-sky-100 transition-colors">
                  ♂
                </div>
              </Link>

              <Link
                href="/admin/candidates?gender=Female"
                className="p-5 rounded-2xl border border-rose-200 bg-white hover:border-rose-400 hover:shadow-md transition-all shadow-sm flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 group-hover:text-rose-700">
                      Female Applicants
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {stats.genderCounts.female}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    {stats.total > 0 ? Math.round((stats.genderCounts.female / stats.total) * 100) : 0}% of total candidates
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-xl group-hover:bg-rose-100 transition-colors">
                  ♀
                </div>
              </Link>
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

            <RecentApplicationsTable initialCandidates={recentCandidates} />
          </section>
        </div>
      </main>
    </div>
  );
}

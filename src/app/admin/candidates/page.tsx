'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { PREFERRED_JOB_ROLES, APPLICATION_STATUSES } from '@/lib/constants';
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Calendar,
  User,
  CheckCircle,
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
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Status update modal state
  const [updatingCandidate, setUpdatingCandidate] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('NEW');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const fetchCandidates = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageToLoad));
      params.set('limit', '10');

      if (search.trim()) params.set('search', search.trim());
      if (selectedRole !== 'ALL') params.set('role', selectedRole);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
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
  }, [search, selectedRole, selectedStatus, dateRange, startDate, endDate]);

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
    setSelectedStatus('ALL');
    setDateRange('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleSaveStatus = async () => {
    if (!updatingCandidate) return;
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/candidates/${updatingCandidate._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationStatus: newStatus,
          statusNotes,
        }),
      });

      if (res.ok) {
        setUpdatingCandidate(null);
        fetchCandidates(pagination.page);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setStatusSaving(false);
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
              Search, filter, update and download candidate applications
            </p>
          </div>
          <button
            onClick={() => fetchCandidates(pagination.page)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </header>

        <div className="p-6 space-y-6 max-w-7xl w-full">
          {/* Search & Filter Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by Candidate Name, Application ID, Mobile..."
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

            {/* Filter Pills */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Role filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Preferred Role
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

              {/* Status filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Application Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Submission Date
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="ALL">All Time</option>
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
                  Clear All Filters
                </button>
              </div>
            </div>

            {/* Custom Date Inputs if 'custom' selected */}
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

          {/* Candidates Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3.5">Application ID</th>
                    <th className="px-4 py-3.5">Photo</th>
                    <th className="px-4 py-3.5">Candidate Name</th>
                    <th className="px-4 py-3.5">Mobile Number</th>
                    <th className="px-4 py-3.5">Gender</th>
                    <th className="px-4 py-3.5">Education</th>
                    <th className="px-4 py-3.5">Preferred Role</th>
                    <th className="px-4 py-3.5">Applied Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-[#006B3C]" />
                          <span>Loading candidate applications...</span>
                        </div>
                      </td>
                    </tr>
                  ) : candidates.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                        No candidate applications found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    candidates.map((candidate) => {
                      const statusObj = APPLICATION_STATUSES.find(
                        (s) => s.value === candidate.applicationStatus
                      );
                      return (
                        <tr key={candidate._id} className="hover:bg-slate-50 transition-colors">
                          {/* ID */}
                          <td className="px-4 py-3 font-mono font-bold text-[#006B3C]">
                            <Link
                              href={`/admin/candidates/${candidate._id}`}
                              className="hover:underline"
                            >
                              {candidate.applicationId}
                            </Link>
                          </td>

                          {/* Photo Thumbnail */}
                          <td className="px-4 py-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center">
                              {candidate.photographStorageKey ? (
                                <img
                                  src={`/api/candidates/${candidate._id}/photo`}
                                  alt={candidate.personalDetails.fullName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <User className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </td>

                          {/* Name */}
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {candidate.personalDetails.fullName}
                          </td>

                          {/* Mobile */}
                          <td className="px-4 py-3 text-slate-600">
                            {candidate.contactDetails.mobileNumber}
                          </td>

                          {/* Gender */}
                          <td className="px-4 py-3 text-slate-600">
                            {candidate.personalDetails.gender}
                          </td>

                          {/* Education */}
                          <td className="px-4 py-3 text-slate-600 truncate max-w-[140px]">
                            {candidate.educationDetails.highestQualification}
                          </td>

                          {/* Preferred Role */}
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 rounded-md">
                              {candidate.preferredJobRole}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {new Date(candidate.submittedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setUpdatingCandidate(candidate);
                                setNewStatus(candidate.applicationStatus);
                                setStatusNotes(candidate.statusNotes || '');
                              }}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 ${
                                statusObj?.color || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {statusObj?.label || candidate.applicationStatus}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <Link
                                href={`/admin/candidates/${candidate._id}`}
                                title="View Complete Application Details"
                                className="p-1.5 text-slate-600 hover:text-[#006B3C] hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>

                              <a
                                href={`/api/candidates/${candidate._id}/pdf`}
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
      </main>

      {/* Quick Status Update Modal */}
      {updatingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Update Application Status</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {updatingCandidate.applicationId} - {updatingCandidate.personalDetails.fullName}
                </p>
              </div>
              <button
                onClick={() => setUpdatingCandidate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Change Status To
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label} ({s.value})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Internal HR Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Called candidate for interview on Monday..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setUpdatingCandidate(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={statusSaving}
                  onClick={handleSaveStatus}
                  className="px-5 py-2 bg-[#006B3C] hover:bg-[#005530] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {statusSaving ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

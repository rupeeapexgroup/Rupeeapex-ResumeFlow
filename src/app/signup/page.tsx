'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface SignupStatus {
  allowed: boolean;
  totalAccounts: number;
  maxAccounts: number;
  remainingSlots: number;
}

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [status, setStatus] = useState<SignupStatus | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch signup status on mount
  useEffect(() => {
    fetchSignupStatus();
  }, []);

  const fetchSignupStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/auth/signup');
      const data = await res.json();
      setStatus(data);
    } catch {
      setErrorMessage('Unable to verify registration status. Please check your connection.');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to complete registration.');
        setSubmitting(false);
        // Refresh status if registration limit was reached
        if (res.status === 403) {
          fetchSignupStatus();
        }
        return;
      }

      setSuccessMessage('Account registered and encrypted in database! Redirecting...');
      setTimeout(() => {
        router.push('/hr/dashboard');
        router.refresh();
      }, 1200);
    } catch {
      setErrorMessage('An unexpected error occurred during signup. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8">
      {/* Signup Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Banner Container */}
        <div className="bg-white p-6 border-b border-slate-100 text-center flex flex-col items-center">
          <div className="relative w-[280px] sm:w-[320px] h-[75px] mb-2">
            <Image
              src="/logo/Rupeeapex-fullBanner.jpeg"
              alt="Rupeeapex Full Banner"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006B3C] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mt-2">
            <Shield className="w-3.5 h-3.5" />
            <span>HR Portal Sign-Up</span>
          </div>
        </div>

        {/* Loading State */}
        {loadingStatus ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#006B3C] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Checking registration limits...</p>
          </div>
        ) : !status?.allowed ? (
          /* BLOCKED STATE: 2 Accounts already registered */
          <div className="p-6 sm:p-8 text-center animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mb-4 shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">Registration Closed</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold mb-4 border border-red-200">
              <Users className="w-3.5 h-3.5" />
              <span>Limit Reached: {status?.totalAccounts || 2} / {status?.maxAccounts || 2} Accounts Registered</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Only a maximum of <strong>2 HR Admin accounts</strong> are permitted. Both accounts have already been registered in the database. Further sign-ups are permanently disabled for security.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 mb-6 space-y-1.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Existing Authorized Accounts:</span>
              </div>
              <p className="text-[11px] text-slate-600 pl-5">
                Please log in using one of the existing authorized credentials.
              </p>
            </div>

            <Link
              href="/login"
              className="w-full py-3 px-4 bg-[#006B3C] hover:bg-[#005530] text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* ALLOWED STATE: Slots available (< 2 accounts) */
          <div className="p-6 sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-slate-900">Create HR Account</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006B3C] text-xs font-semibold mt-2 border border-emerald-200">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {status?.remainingSlots} of {status?.maxAccounts} Slot{status?.remainingSlots === 1 ? '' : 's'} Remaining
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Strict limit: Only 2 accounts can ever be created. Once filled, sign-up will close permanently.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-[#006B3C] animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-[#006B3C] shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{successMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Choose Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. RAHR-C214"
                    required
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B3C] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password (min 6 chars)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B3C] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B3C] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 bg-[#006B3C] hover:bg-[#005530] text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Encrypting & Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Sign Up & Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer / Login Link */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-center text-xs text-slate-500 flex items-center justify-between">
          <Link href="/login" className="text-slate-600 hover:text-[#006B3C] font-medium transition-colors">
            Already have an account? Sign In
          </Link>
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            Reception Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}


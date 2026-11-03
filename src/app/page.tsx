import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CompanyHeader } from '@/components/branding/CompanyHeader';
import { QrCode, FileText, Lock, CheckCircle2, ArrowRight, ShieldCheck, Download } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <CompanyHeader subtitle="HR Recruitment Portal" />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-[#006B3C] animate-pulse"></span>
            Rupeeapex Career Opportunities
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome to <span className="text-[#006B3C]">ResumeFlow</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            The official HR Job Application Management System for Rupeeapex Groups of Companies.
            Join our expanding financial services and business operations across all divisions.
          </p>
        </div>

        {/* Two Portals Grid */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Candidate Job Application */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#006B3C]"></div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#006B3C] flex items-center justify-center mb-5 border border-emerald-100">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Candidate Application</h2>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Scan the reception QR code or click below to fill out your job application form online. No account creation required.
              </p>

              {/* Roles Offered */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Preferred Business Divisions:
                </div>
                <div className="flex flex-wrap gap-2">
                  {['GOLD', 'NIDHI', 'MFI', 'CHIT', 'INSURANCE'].map((role) => (
                    <span
                      key={role}
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-[#006B3C] rounded-md border border-emerald-200"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Steps list */}
              <ul className="space-y-2 mb-6 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fill personal, education & employment details</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Upload passport-size photograph directly from phone</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Receive instant unique Application ID upon submission</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/apply"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#006B3C] hover:bg-[#005530] text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
              >
                <span>Start Job Application</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Reception QR Poster & Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#F5C400]"></div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5 border border-amber-100">
                <QrCode className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Reception QR Code</h2>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                Scan with any mobile camera at the Rupeeapex reception counter to immediately access the application form.
              </p>

              {/* QR Preview Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 mb-4">
                <div className="relative w-32 h-32 bg-white rounded-lg p-1.5 border border-slate-200 shadow-sm shrink-0">
                  <Image
                    src="/qr/reception-qr.png"
                    alt="Reception QR Code"
                    width={128}
                    height={128}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left text-xs text-slate-600 space-y-1.5">
                  <div className="font-semibold text-slate-800 text-sm">Official Reception QR</div>
                  <p>Permanent QR code linking directly to public candidate form.</p>
                  <p className="font-mono text-[11px] text-[#006B3C] break-all">/apply</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <a
                href="/qr/reception-poster.pdf"
                download="Rupeeapex_Reception_Poster_A4.pdf"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold rounded-xl border border-amber-300 transition-colors text-sm"
              >
                <Download className="w-4 h-4 text-amber-700" />
                <span>Download A4 Poster</span>
              </a>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm"
              >
                <Lock className="w-4 h-4 text-slate-500" />
                <span>HR Portal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Security & Confidentiality Notice */}
        <div className="mt-12 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Rupeeapex Data Security Guarantee:</span> All candidate applications and photographs are transmitted over encrypted protocols and stored in protected private storage. Candidate information is restricted strictly to authorized Rupeeapex HR personnel.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          © {new Date().getFullYear()} Rupeeapex Groups of Companies. All rights reserved. ResumeFlow System v1.0.
        </div>
      </footer>
    </div>
  );
}

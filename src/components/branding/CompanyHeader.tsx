'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CompanyHeaderProps {
  subtitle?: string;
  showBackHome?: boolean;
}

export function CompanyHeader({ subtitle, showBackHome }: CompanyHeaderProps) {
  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-95">
          <div className="relative w-[280px] sm:w-[360px] h-[65px] sm:h-[75px]">
            <Image
              src="/logo/Rupeeapex-fullBanner.jpeg"
              alt="Rupeeapex Groups of Companies"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        <div className="flex items-center gap-3 text-right">
          {subtitle && (
            <div className="hidden sm:block text-xs font-semibold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              {subtitle}
            </div>
          )}
          {showBackHome && (
            <Link
              href="/"
              className="text-xs font-medium text-slate-600 hover:text-[#006B3C] transition-colors"
            >
              ← Back to Portal Home
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

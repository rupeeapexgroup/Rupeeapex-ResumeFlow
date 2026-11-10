'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Shield,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

interface AdminSidebarProps {
  currentUsername?: string;
}

export function AdminSidebar({ currentUsername = 'HR Admin' }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeUsername, setActiveUsername] = useState(currentUsername);

  useEffect(() => {
    if (!currentUsername || currentUsername === 'HR Admin') {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.username) {
            setActiveUsername(data.user.username.toUpperCase());
          }
        })
        .catch(() => {});
    } else {
      setActiveUsername(currentUsername);
    }
  }, [currentUsername]);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Candidate Applications',
      href: '/admin/candidates',
      icon: Users,
    },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden w-full bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <Image
              src="/logo/rupeeapex-logo.jpeg"
              alt="Rupeeapex Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-bold text-slate-900 text-sm">ResumeFlow HR</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-white p-1 overflow-hidden shrink-0">
              <Image
                src="/logo/rupeeapex-logo.jpeg"
                alt="Rupeeapex Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="overflow-hidden">
              <div className="font-extrabold text-base tracking-wide text-white">
                RUPEE<span className="text-[#F5C400]">APEX</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                ResumeFlow HR Portal
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Recruitment Navigation
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#006B3C] text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout at Bottom */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{activeUsername}</div>
              <div className="text-[10px] text-emerald-400 font-medium">Authorized HR</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-red-950/40 text-red-300 border border-red-900/50 hover:bg-red-900/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}


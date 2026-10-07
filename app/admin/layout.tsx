'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  Shield,
  FileBarChart,
  Settings,
  History,
  LogOut,
  QrCode,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Data Siswa', href: '/admin/students', icon: GraduationCap },
  { name: 'Data Kelas', href: '/admin/classes', icon: Users },
  { name: 'Presensi & Koreksi', href: '/admin/attendance', icon: CalendarCheck },
  { name: 'Petugas Keamanan', href: '/admin/security', icon: Shield },
  { name: 'Laporan & Export', href: '/admin/reports', icon: FileBarChart },
  { name: 'Pengaturan Jam', href: '/admin/settings', icon: Settings },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none">ABSEN SKANEXA</h1>
            <p className="text-[10px] text-sky-300 font-semibold">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white shadow-md">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight leading-tight">
                ABSEN SKANEXA
              </h2>
              <p className="text-xs text-sky-400 font-medium">Administrator Panel</p>
            </div>
          </div>

          {/* Quick links to Scanner & Student */}
          <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
            <a
              href="/security"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-xl hover:bg-emerald-900/40 transition"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Buka Kamera Scanner
              </span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-900/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Footer User & Logout */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Admin SKANEXA</p>
                <p className="text-[10px] text-slate-400 font-mono">admin@skanexa</p>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
        ></div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  LogOut,
  Calendar,
  Shield,
  GraduationCap,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { formatDisplayTime } from '@/lib/time';

interface DashboardData {
  todayDate: string;
  formattedDate: string;
  stats: {
    totalStudents: number;
    checkInCount: number;
    lateCount: number;
    notCheckedInCount: number;
    checkOutCount: number;
  };
  settings: {
    check_in_start: string;
    late_threshold: string;
    check_out_start: string;
  };
  recentAttendance: any[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const interval = window.setInterval(() => {
      fetchDashboard(false);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-xs font-semibold text-slate-500">Memuat data dashboard...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalStudents: 0,
    checkInCount: 0,
    lateCount: 0,
    notCheckedInCount: 0,
    checkOutCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              Ikhtisar Presensi Realtime
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Absen SKANEXA
          </h1>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{data?.formattedDate || 'Hari Ini'} (WIB)</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <a
            href="/security"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Buka Scanner Kamera</span>
          </a>
        </div>
      </div>

      {/* 5 KPI Metric Cards (PRD Section 32) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Siswa */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Siswa</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalStudents}</p>
          <span className="text-[10px] text-slate-400 mt-1">Siswa Terdaftar Aktif</span>
        </div>

        {/* Check In */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Check In</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{stats.checkInCount}</p>
          <span className="text-[10px] text-emerald-600/80 mt-1 font-medium">Sudah Masuk Hari Ini</span>
        </div>

        {/* Terlambat */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Terlambat</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700">{stats.lateCount}</p>
          <span className="text-[10px] text-amber-600/80 mt-1 font-medium">&gt; {data?.settings?.late_threshold || '07:15'} WIB</span>
        </div>

        {/* Belum Absen */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Belum Absen</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700">{stats.notCheckedInCount}</p>
          <span className="text-[10px] text-rose-600/80 mt-1 font-medium">Belum Melakukan Scan</span>
        </div>

        {/* Check Out */}
        <div className="bg-white p-4 rounded-2xl border border-sky-200/80 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-sky-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Check Out</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-700">{stats.checkOutCount}</p>
          <span className="text-[10px] text-sky-600/80 mt-1 font-medium">Sudah Presensi Pulang</span>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Aktivitas Presensi Hari Ini</h2>
            <p className="text-xs text-slate-500">Daftar siswa yang telah melakukan scan presensi</p>
          </div>
          <a
            href="/admin/attendance"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Pulang</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data?.recentAttendance && data.recentAttendance.length > 0 ? (
                data.recentAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.student_name}</td>
                    <td className="py-3 px-4 font-medium">{rec.class_name}</td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {formatDisplayTime(rec.check_in_at)}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {formatDisplayTime(rec.check_out_at)}
                    </td>
                    <td className="py-3 px-4">
                      {rec.status === 'present' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Hadir
                        </span>
                      )}
                      {rec.status === 'late' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Terlambat
                        </span>
                      )}
                      {rec.status === 'checked_out' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                          Selesai Out
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{rec.check_in_by_name || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada siswa yang melakukan scan presensi hari ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

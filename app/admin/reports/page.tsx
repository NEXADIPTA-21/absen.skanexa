'use client';

import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle2,
  Clock,
  LogOut,
} from 'lucide-react';
import { AttendanceRecord, ClassItem } from '@/lib/types';
import { formatDisplayTime, getTodayDateWIB } from '@/lib/time';

export default function AdminReportsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(getTodayDateWIB());
  const [endDate, setEndDate] = useState(getTodayDateWIB());
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      if (data.success) setClasses(data.classes);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    try {
      let url = `/api/admin/reports?startDate=${startDate}&endDate=${endDate}`;
      if (selectedClass !== 'all') url += `&classId=${selectedClass}`;
      if (selectedStatus !== 'all') url += `&status=${selectedStatus}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, selectedClass, selectedStatus]);

  const handleExportCsv = () => {
    let url = `/api/admin/reports?startDate=${startDate}&endDate=${endDate}&format=csv`;
    if (selectedClass !== 'all') url += `&classId=${selectedClass}`;
    if (selectedStatus !== 'all') url += `&status=${selectedStatus}`;

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Laporan & Export Absensi</h1>
          <p className="text-xs text-slate-500 font-medium">
            Unduh rekap data absensi siswa dalam format CSV untuk pelaporan sekolah
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Download Rekap CSV</span>
        </button>
      </div>

      {/* Filter Range Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3 items-center">
        {/* Start Date */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Dari:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Sampai:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="present">Hadir</option>
            <option value="late">Terlambat</option>
            <option value="checked_out">Checked Out</option>
          </select>
        </div>
      </div>

      {/* Reports Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total Record Ditemukan: <strong className="text-slate-900">{records.length}</strong>
          </span>
          <span>Format file: .CSV (Mendukung Microsoft Excel & Google Sheets)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Petugas Masuk</th>
                <th className="py-3 px-4">Petugas Pulang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data laporan...
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500">
                      {r.attendance_date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.student_name}</td>
                    <td className="py-3.5 px-4 font-medium">{r.class_name}</td>
                    <td className="py-3.5 px-4 font-mono font-medium">
                      {formatDisplayTime(r.check_in_at)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium">
                      {formatDisplayTime(r.check_out_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.status === 'present' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Hadir
                        </span>
                      )}
                      {r.status === 'late' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Terlambat
                        </span>
                      )}
                      {r.status === 'checked_out' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                          Checked Out
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{r.check_in_by_name || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{r.check_out_by_name || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada record presensi dalam rentang tanggal ini.
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

'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Filter,
  Search,
  Edit2,
  CheckCircle2,
  Clock,
  LogOut,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { AttendanceRecord, ClassItem } from '@/lib/types';
import { formatDisplayTime, getTodayDateWIB } from '@/lib/time';

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDateWIB());
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Correction Modal
  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null);
  const [checkInTimeInput, setCheckInTimeInput] = useState('');
  const [checkOutTimeInput, setCheckOutTimeInput] = useState('');
  const [statusInput, setStatusInput] = useState<'present' | 'late' | 'checked_out' | 'absent'>('present');
  const [reasonInput, setReasonInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      if (data.success) setClasses(data.classes);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendance = async () => {
    try {
      let url = `/api/admin/attendance?date=${selectedDate}`;
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
    fetchAttendance();
  }, [selectedDate, selectedClass, selectedStatus]);

  // Open correction modal
  const handleOpenCorrect = (rec: AttendanceRecord) => {
    setActiveRecord(rec);

    // Convert ISO to HH:MM for time inputs
    const inTime = rec.check_in_at ? new Date(rec.check_in_at).toTimeString().slice(0, 5) : '';
    const outTime = rec.check_out_at ? new Date(rec.check_out_at).toTimeString().slice(0, 5) : '';

    setCheckInTimeInput(inTime);
    setCheckOutTimeInput(outTime);
    setStatusInput(rec.status);
    setReasonInput('Koreksi jam masuk/pulang oleh admin');
    setError(null);
    setCorrectModalOpen(true);
  };

  // Submit manual correction
  const handleCorrectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord) return;

    setSaving(true);
    setError(null);

    try {
      // Reconstruct ISO strings if time is given
      let check_in_iso = activeRecord.check_in_at;
      if (checkInTimeInput) {
        const [h, m] = checkInTimeInput.split(':');
        const d = new Date(activeRecord.attendance_date);
        d.setHours(Number(h), Number(m), 0, 0);
        check_in_iso = d.toISOString();
      } else {
        check_in_iso = null;
      }

      let check_out_iso = activeRecord.check_out_at;
      if (checkOutTimeInput) {
        const [h, m] = checkOutTimeInput.split(':');
        const d = new Date(activeRecord.attendance_date);
        d.setHours(Number(h), Number(m), 0, 0);
        check_out_iso = d.toISOString();
      } else {
        check_out_iso = null;
      }

      const res = await fetch('/api/admin/attendance/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeRecord.id,
          check_in_at: check_in_iso,
          check_out_at: check_out_iso,
          status: statusInput,
          reason: reasonInput,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menyimpan koreksi.');

      setCorrectModalOpen(false);
      fetchAttendance();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Presensi & Koreksi</h1>
          <p className="text-xs text-slate-500 font-medium">
            Pantau kehadiran harian dan lakukan koreksi data absensi manual siswa
          </p>
        </div>

        <a
          href="/admin/reports"
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition inline-flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Laporan</span>
        </a>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3 items-center">
        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
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

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-right">Koreksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat data absensi...
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
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
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenCorrect(r)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Koreksi</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada record absensi untuk tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Correction Modal (PRD Section 35) */}
      {correctModalOpen && activeRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setCorrectModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">Koreksi Absensi Manual</h2>
            <p className="text-xs text-slate-500 mb-1">
              Siswa: <strong>{activeRecord.student_name}</strong> ({activeRecord.class_name})
            </p>
            <p className="text-[11px] text-slate-400 mb-4 font-mono">
              Tanggal: {activeRecord.attendance_date}
            </p>

            {error && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCorrectSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Waktu Check In (HH:mm)
                </label>
                <input
                  type="time"
                  value={checkInTimeInput}
                  onChange={(e) => setCheckInTimeInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Waktu Check Out (HH:mm)
                </label>
                <input
                  type="time"
                  value={checkOutTimeInput}
                  onChange={(e) => setCheckOutTimeInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Absensi
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="present">Hadir Tepat Waktu</option>
                  <option value="late">Terlambat</option>
                  <option value="checked_out">Selesai / Checked Out</option>
                  <option value="absent">Tidak Hadir / Izin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Koreksi (Tercatat di Audit Log)
                </label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Contoh: Siswa lupa bawa HP / Izin tugas luar"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Koreksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

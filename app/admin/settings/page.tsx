'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Clock, Save, CheckCircle2, Globe, AlertCircle } from 'lucide-react';
import { AttendanceSettings } from '@/lib/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [checkInStart, setCheckInStart] = useState('06:00');
  const [lateThreshold, setLateThreshold] = useState('07:15');
  const [checkInEnd, setCheckInEnd] = useState('08:00');
  const [checkOutStart, setCheckOutStart] = useState('15:00');
  const [checkOutEnd, setCheckOutEnd] = useState('17:30');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setCheckInStart(data.settings.check_in_start.slice(0, 5));
        setLateThreshold(data.settings.late_threshold.slice(0, 5));
        setCheckInEnd(data.settings.check_in_end.slice(0, 5));
        setCheckOutStart(data.settings.check_out_start.slice(0, 5));
        setCheckOutEnd(data.settings.check_out_end.slice(0, 5));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in_start: `${checkInStart}:00`,
          late_threshold: `${lateThreshold}:00`,
          check_in_end: `${checkInEnd}:00`,
          check_out_start: `${checkOutStart}:00`,
          check_out_end: `${checkOutEnd}:00`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menyimpan pengaturan.');

      setSuccessMsg('Pengaturan jam absensi sekolah berhasil disimpan.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-xs font-semibold text-slate-500">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Pengaturan Jam Absensi
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Tentukan jendela waktu Check In, batas toleransi keterlambatan, dan jam Check Out pulang
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        {/* Timezone Info */}
        <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-sky-900">Zona Waktu Sistem: Asia/Jakarta (WIB)</p>
            <p className="text-[11px] text-sky-700">
              Seluruh pencatatan absensi scanner dan dashboard disinkronkan dengan Waktu Indonesia Barat.
            </p>
          </div>
        </div>

        {/* Section 1: Check In Window */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-emerald-600" />
            Jadwal Check In (Masuk Pagi)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Mulai Masuk
              </label>
              <input
                type="time"
                value={checkInStart}
                onChange={(e) => setCheckInStart(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 06:00 WIB</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-700 mb-1">
                Batas Toleransi Terlambat
              </label>
              <input
                type="time"
                value={lateThreshold}
                onChange={(e) => setLateThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-amber-50/50 border border-amber-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-900"
                required
              />
              <span className="text-[10px] text-amber-600 mt-1 block">Scan setelah jam ini = Terlambat</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Selesai Masuk
              </label>
              <input
                type="time"
                value={checkInEnd}
                onChange={(e) => setCheckInEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 08:00 WIB</span>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section 2: Check Out Window */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-sky-600" />
            Jadwal Check Out (Pulang Sekolah)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Mulai Pulang
              </label>
              <input
                type="time"
                value={checkOutStart}
                onChange={(e) => setCheckOutStart(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 15:00 WIB</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Batas Akhir Pulang
              </label>
              <input
                type="time"
                value={checkOutEnd}
                onChange={(e) => setCheckOutEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 17:30 WIB</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

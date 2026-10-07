'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  User,
  GraduationCap,
  Calendar,
} from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  username: string;
  class_name: string;
  qr_token: string;
  status: string;
}

interface AttendanceData {
  status: string;
  check_in_at: string | null;
  check_out_at: string | null;
  check_in_formatted: string;
  check_out_formatted: string;
}

export default function StudentQrPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [formattedDate, setFormattedDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const fetchStudentData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/student/me');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStudent(data.student);
        setAttendance(data.attendance);
        setFormattedDate(data.formattedDate);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudentData();

    // Live clock update
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('student-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 32, 32, 448, 448);
        const a = document.createElement('a');
        a.download = `QR-SKANEXA-${student?.name?.replace(/\s+/g, '_') || 'Siswa'}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Memuat Kartu Absensi Siswa...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Data Siswa Tidak Ditemukan</h2>
        <button
          onClick={handleLogout}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm"
        >
          Kembali ke Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 pb-12">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Top Bar */}
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">ABSEN SKANEXA</h1>
              <p className="text-[11px] text-slate-500 font-medium">SMK Negeri 1 Kandeman</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Digital Student Card Container */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200/80 overflow-hidden flex flex-col">
          {/* Header Card with Gradient */}
          <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-cyan-700 p-5 text-white text-center relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate || 'Hari Ini'}</span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight line-clamp-1">
              {student.name}
            </h2>
            <div className="inline-flex items-center gap-1.5 text-sky-100 text-sm font-semibold mt-1">
              <GraduationCap className="w-4 h-4" />
              <span>{student.class_name}</span>
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="p-6 flex flex-col items-center justify-center bg-white">
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-inner flex flex-col items-center">
              <QRCodeSVG
                id="student-qr-svg"
                value={student.qr_token}
                size={220}
                level="H"
                includeMargin={true}
                className="rounded-lg"
              />
            </div>

            {/* Token badge */}
            <div className="mt-3 px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-[11px] font-mono tracking-wider font-semibold border border-slate-200">
              {student.qr_token}
            </div>

            <p className="text-xs text-slate-500 font-medium mt-3 text-center">
              Tunjukkan QR Code ini kepada <strong className="text-slate-800">Sie Keamanan</strong> saat masuk atau pulang sekolah.
            </p>

            <button
              onClick={handleDownloadQr}
              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan Gambar QR</span>
            </button>
          </div>

          {/* Status Section */}
          <div className="bg-slate-50 p-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Status Absensi Hari Ini
              </span>
              <button
                onClick={() => fetchStudentData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Check In Status Card */}
              <div
                className={`p-3 rounded-2xl border ${
                  attendance?.check_in_at
                    ? attendance?.status === 'late'
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {attendance?.check_in_at ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold">Check In</span>
                </div>
                <p className="text-sm font-black">
                  {attendance?.check_in_at ? attendance.check_in_formatted : 'Belum Absen'}
                </p>
                {attendance?.status === 'late' && (
                  <span className="text-[10px] font-bold text-amber-700 block mt-0.5">
                    Terlambat
                  </span>
                )}
              </div>

              {/* Check Out Status Card */}
              <div
                className={`p-3 rounded-2xl border ${
                  attendance?.check_out_at
                    ? 'bg-sky-50/80 border-sky-200 text-sky-900'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {attendance?.check_out_at ? (
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold">Check Out</span>
                </div>
                <p className="text-sm font-black">
                  {attendance?.check_out_at ? attendance.check_out_formatted : 'Belum Out'}
                </p>
              </div>
            </div>

            {/* Live Clock Display */}
            {currentTime && (
              <p className="text-[11px] text-center text-slate-400 font-mono mt-3">
                Waktu Sekarang: {currentTime}
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 font-medium">
          Siswa tidak dapat memindai sendiri. QR hanya dipindai oleh petugas keamanan.
        </div>
      </div>
    </div>
  );
}

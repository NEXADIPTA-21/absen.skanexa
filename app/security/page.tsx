'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  LogOut,
  Camera,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  Keyboard,
  X,
  History,
} from 'lucide-react';
import { AttendanceAction, ScanResponse } from '@/lib/types';

interface ScanFeedback {
  type: 'success' | 'warning' | 'error';
  title: string;
  name?: string;
  className?: string;
  time?: string;
  message?: string;
  action: AttendanceAction;
}

interface RecentScanItem {
  id: string;
  name: string;
  className: string;
  action: AttendanceAction;
  time: string;
  status: string;
}

export default function SecurityScannerPage() {
  const router = useRouter();
  const [action, setAction] = useState<AttendanceAction>('check_in');
  const actionRef = useRef<AttendanceAction>('check_in');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [recentScans, setRecentScans] = useState<RecentScanItem[]>([]);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  // Scanner state refs to avoid closure stale state
  const lastScannedTokenRef = useRef<string | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const isProcessingRef = useRef(false);
  const html5QrCodeRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play synthesized web audio beep
  const playSound = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1); // E6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(350, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio might be blocked by browser autoplay policy until user gesture
    }
  };

  // Ultra-fast Attendance Verification
  const processToken = async (token: string) => {
    const currentAction = actionRef.current;
    if (!token || isProcessingRef.current) return;

    const now = Date.now();
    // Debounce: prevent duplicate scan of same token within 3.5 seconds
    if (
      lastScannedTokenRef.current === token &&
      now - lastScanTimestampRef.current < 3500
    ) {
      return;
    }

    lastScannedTokenRef.current = token;
    lastScanTimestampRef.current = now;
    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: currentAction }),
      });

      const data: ScanResponse = await res.json();

      if (data.success) {
        playSound('success');
        setFeedback({
          type: 'success',
          title: currentAction === 'check_in' ? 'CHECK IN BERHASIL' : 'CHECK OUT BERHASIL',
          name: data.name,
          className: data.class,
          time: data.time,
          message: data.message,
          action: currentAction,
        });

        // Add to recent list
        setRecentScans((prev) => [
          {
            id: String(Date.now()),
            name: data.name,
            className: data.class,
            action: currentAction,
            time: data.time,
            status: data.status,
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        // Business Rejections / Errors
        if (data.code === 'ALREADY_CHECKED_IN') {
          playSound('warning');
          setFeedback({
            type: 'warning',
            title: 'SUDAH CHECK IN',
            name: data.details?.name,
            className: data.details?.class,
            time: data.details?.time,
            message: data.message,
            action: currentAction,
          });
        } else if (data.code === 'ALREADY_CHECKED_OUT') {
          playSound('warning');
          setFeedback({
            type: 'warning',
            title: 'SUDAH CHECK OUT',
            name: data.details?.name,
            className: data.details?.class,
            time: data.details?.time,
            message: data.message,
            action: currentAction,
          });
        } else if (data.code === 'NOT_CHECKED_IN') {
          playSound('error');
          setFeedback({
            type: 'error',
            title: 'CHECK OUT DITOLAK',
            name: data.details?.name,
            className: data.details?.class,
            message: data.message,
            action: currentAction,
          });
        } else if (data.code === 'STUDENT_DISABLED') {
          playSound('error');
          setFeedback({
            type: 'error',
            title: 'SISWA NONAKTIF',
            name: data.details?.name,
            className: data.details?.class,
            message: 'Akun dinonaktifkan. Hubungi Admin.',
            action: currentAction,
          });
        } else {
          playSound('error');
          setFeedback({
            type: 'error',
            title: 'QR TIDAK VALID',
            message: data.message || 'QR Code tidak dikenali oleh sistem.',
            action: currentAction,
          });
        }
      }
    } catch (err) {
      playSound('error');
      setFeedback({
        type: 'error',
        title: 'KONEKSI BERMASALAH',
        message: 'Gagal terhubung ke server. Absensi belum tercatat.',
        action: currentAction,
      });
    } finally {
      // Auto-ready for next student in 1.8 seconds WITHOUT stopping camera!
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
        setFeedback(null);
      }, 1900);
    }
  };

  // Initialize camera scanner using html5-qrcode
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 15, // fast 15 scans per second
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: cameraFacing },
          config,
          (decodedText) => {
            // Success QR detection callback
            processToken(decodedText);
          },
          () => {
            // continuous scanning frames (no error throw needed)
          }
        );

        if (isMounted) {
          setCameraActive(true);
          setCameraError(null);
        }
      } catch (err: any) {
        console.error('Camera init error:', err);
        if (isMounted) {
          setCameraError(
            'Kamera tidak dapat diakses. Pastikan izin kamera aktif atau gunakan tombol Input Manual.'
          );
          setCameraActive(false);
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [cameraFacing]);

  const handleLogout = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop().catch(() => {});
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setManualModalOpen(false);
    processToken(manualToken.trim());
    setManualToken('');
  };

  return (
    <div className="security-scanner-shell bg-slate-900 text-white flex flex-col max-w-md mx-auto select-none">
      {/* 1. Header Bar */}
      <header className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              ABSEN SKANEXA
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">
                PETUGAS
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">SMK Negeri 1 Kandeman</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Audio feedback"
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Manual Input modal trigger */}
          <button
            onClick={() => setManualModalOpen(true)}
            title="Input Manual"
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <Keyboard className="w-4 h-4 text-sky-400" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Check In / Check Out Mode Selector */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 z-20">
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => { actionRef.current = 'check_in'; setAction('check_in'); }}
            className={`py-3 rounded-xl font-black text-sm tracking-wide transition flex items-center justify-center gap-2 ${
              action === 'check_in'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>CHECK IN</span>
          </button>

          <button
            type="button"
            onClick={() => { actionRef.current = 'check_out'; setAction('check_out'); }}
            className={`py-3 rounded-xl font-black text-sm tracking-wide transition flex items-center justify-center gap-2 ${
              action === 'check_out'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40 ring-2 ring-sky-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>CHECK OUT</span>
          </button>
        </div>
      </div>

      {/* 3. Camera Viewfinder Area */}
      <div className="security-camera-stage relative flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden">
        {/* html5-qrcode video element target */}
        <div id="qr-reader" className="w-full h-full object-cover"></div>

        {/* Viewfinder Target Framing Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-64 h-64 border-2 border-white/20 rounded-3xl">
            {/* 4 Glowing Corner Accents */}
            <div
              className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl transition-colors duration-300 ${
                action === 'check_in' ? 'border-emerald-400' : 'border-sky-400'
              }`}
            ></div>
            <div
              className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl transition-colors duration-300 ${
                action === 'check_in' ? 'border-emerald-400' : 'border-sky-400'
              }`}
            ></div>
            <div
              className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl transition-colors duration-300 ${
                action === 'check_in' ? 'border-emerald-400' : 'border-sky-400'
              }`}
            ></div>
            <div
              className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl transition-colors duration-300 ${
                action === 'check_in' ? 'border-emerald-400' : 'border-sky-400'
              }`}
            ></div>

            {/* Moving Laser Scan Line */}
            {cameraActive && !feedback && (
              <div
                className={`absolute left-2 right-2 h-0.5 rounded-full shadow-[0_0_12px] animate-scanline ${
                  action === 'check_in'
                    ? 'bg-emerald-400 shadow-emerald-400'
                    : 'bg-sky-400 shadow-sky-400'
                }`}
              ></div>
            )}
          </div>
        </div>

        {/* Camera Permission / Error Fallback Notice */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <Camera className="w-12 h-12 text-rose-500 mb-3" />
            <p className="text-sm font-semibold text-rose-400 mb-2">Akses Kamera Bermasalah</p>
            <p className="text-xs text-slate-400 max-w-xs mb-4">{cameraError}</p>
            <button
              onClick={() => setManualModalOpen(true)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2"
            >
              <Keyboard className="w-4 h-4" />
              <span>Gunakan Input Manual</span>
            </button>
          </div>
        )}

        {/* 4. Instant Scanner Feedback Card (PRD Section 22) */}
        {feedback && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`w-full max-w-xs p-6 rounded-3xl border-2 shadow-2xl text-center transform transition-all ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500 text-white'
                  : feedback.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500 text-white'
                  : 'bg-rose-950/90 border-rose-500 text-white'
              }`}
            >
              <div className="flex justify-center mb-3">
                {feedback.type === 'success' ? (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-4 ring-emerald-500/40">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : feedback.type === 'warning' ? (
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center ring-4 ring-amber-500/40">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center ring-4 ring-rose-500/40">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                )}
              </div>

              <h2 className="text-lg font-black tracking-wider uppercase mb-1">
                {feedback.title}
              </h2>

              {feedback.name && (
                <div className="mt-2 py-2 border-y border-white/10">
                  <p className="text-xl font-extrabold text-white leading-tight">
                    {feedback.name}
                  </p>
                  {feedback.className && (
                    <p className="text-sm font-semibold text-slate-300 mt-0.5">
                      {feedback.className}
                    </p>
                  )}
                  {feedback.time && (
                    <p className="text-xs font-mono font-bold text-emerald-400 mt-1">
                      {feedback.time}
                    </p>
                  )}
                </div>
              )}

              {feedback.message && (
                <p className="text-xs text-slate-300 mt-2 font-medium">
                  {feedback.message}
                </p>
              )}

              <div className="mt-4 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" />
                <span>SCAN SISWA BERIKUTNYA</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom Ready / Status Bar */}
      <footer className="p-3 bg-slate-900 border-t border-slate-800 z-20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isProcessing
                  ? 'bg-amber-400 animate-ping'
                  : cameraActive
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            ></div>
            <span className="text-xs font-bold tracking-wide text-slate-300">
              {isProcessing
                ? 'MEMPROSES VERIFIKASI...'
                : cameraActive
                ? 'SIAP SCAN SISWA (READY)'
                : 'KAMERA TIDAK AKTIF'}
            </span>
          </div>

          <button
            onClick={() =>
              setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))
            }
            className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
          >
            Ganti Kamera
          </button>
        </div>

        {/* Recent Scans Strip */}
        {recentScans.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <History className="w-3 h-3" />
              <span>Riwayat Scan Terakhir ({recentScans.length})</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {recentScans.slice(0, 4).map((scan) => (
                <div
                  key={scan.id}
                  className="shrink-0 px-2.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-[11px] flex items-center gap-2"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      scan.action === 'check_in' ? 'bg-emerald-400' : 'bg-sky-400'
                    }`}
                  ></span>
                  <span className="font-bold text-white max-w-[100px] truncate">{scan.name}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{scan.time.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </footer>

      {/* Manual Input Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setManualModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-sky-400" />
              Input Token Manual
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Masukkan token QR siswa secara manual jika kamera tidak dapat membaca.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Token QR Siswa
                </label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                  placeholder="SKNX-ATT-XXXXXXXXXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
                  autoFocus
                />
              </div>

              {/* Sample tokens quick pick for testing */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Pilih Cepat Contoh Token:</p>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {[
                    { name: 'Ahmad Fauzan (XII RPL 1)', token: 'SKNX-ATT-8891AF2491CB8821' },
                    { name: 'Budi Santoso (XII RPL 1)', token: 'SKNX-ATT-7729BD4812EF9012' },
                    { name: 'Citra Lestari (XII RPL 2)', token: 'SKNX-ATT-6618CD7933FA1145' },
                    { name: 'Dedi Kurniawan (XI RPL 1)', token: 'SKNX-ATT-5507DE8844BC2236' },
                  ].map((s) => (
                    <button
                      key={s.token}
                      type="button"
                      onClick={() => setManualToken(s.token)}
                      className="text-left text-xs p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 font-mono transition flex justify-between items-center"
                    >
                      <span className="font-sans font-medium text-slate-200">{s.name}</span>
                      <span className="text-[10px] text-sky-400">{s.token.slice(0, 12)}...</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!manualToken.trim()}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
                >
                  Verifikasi Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

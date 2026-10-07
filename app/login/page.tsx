'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Shield, User, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Harap masukkan username dan password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Login gagal. Periksa username dan password.');
        setLoading(false);
        return;
      }

      // Success redirect
      router.push(data.redirectUrl);
    } catch (err: any) {
      setError('Koneksi bermasalah. Pastikan server aktif.');
      setLoading(false);
    }
  };

  const setDemoAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center justify-center gap-2">
            ABSEN SKANEXA
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              v1.0
            </span>
          </h1>
          <p className="text-sky-100 text-sm mt-1 font-medium">
            Sistem Presensi Cepat Berbasis QR Code Siswa
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin / security01 / ahmad.fauzan"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Uji Coba Cepat (Pilih Akun Demo)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount('admin', 'admin123')}
                className="p-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-medium text-slate-700 hover:text-sky-700 transition text-center flex flex-col items-center gap-1"
              >
                <Shield className="w-4 h-4 text-sky-600" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('security01', 'security123')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-medium text-slate-700 hover:text-emerald-700 transition text-center flex flex-col items-center gap-1"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Keamanan</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('ahmad.fauzan', 'student123')}
                className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-medium text-slate-700 hover:text-indigo-700 transition text-center flex flex-col items-center gap-1"
              >
                <User className="w-4 h-4 text-indigo-600" />
                <span>Siswa</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            SMK Negeri 1 Kandeman • Domain: <span className="font-mono text-slate-700">absen.skanexa-21.my.id</span>
          </p>
        </div>
      </div>
    </div>
  );
}

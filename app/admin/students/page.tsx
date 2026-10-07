'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  Plus,
  Search,
  Filter,
  QrCode,
  KeyRound,
  Edit2,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Printer,
  Download,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Student, ClassItem } from '@/lib/types';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [resetPassModalOpen, setResetPassModalOpen] = useState(false);

  // Active student for modals
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('student123');
  const [classInput, setClassInput] = useState('');
  const [statusInput, setStatusInput] = useState<'active' | 'disabled'>('active');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
        if (data.classes.length > 0 && !classInput) {
          setClassInput(data.classes[0].id);
        }
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Gagal mengambil data siswa.');
    }
  };

  const fetchStudents = async () => {
    try {
      let url = `/api/admin/students?`;
      if (selectedClass !== 'all') url += `classId=${selectedClass}&`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;

      const res = await fetch(url, { method: 'GET', cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengambil data siswa.');
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Gagal mengambil data siswa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, search]);

  // Open Add Student Modal
  const handleOpenAdd = () => {
    setNameInput('');
    setUsernameInput('');
    setPasswordInput('student123');
    setClassInput(classes[0]?.id || '');
    setError(null);
    setAddModalOpen(true);
  };

  // Auto suggest username when name is typed
  const handleNameChange = (val: string) => {
    setNameInput(val);
    if (!usernameInput || usernameInput === nameInput.toLowerCase().replace(/\s+/g, '.').slice(0, 15)) {
      setUsernameInput(val.toLowerCase().trim().replace(/\s+/g, '.').slice(0, 20));
    }
  };

  // Submit Add Student
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput || !usernameInput || !passwordInput || !classInput) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          username: usernameInput,
          password: passwordInput,
          class_id: classInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menambahkan siswa.');

      setAddModalOpen(false);
      await fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Student Modal
  const handleOpenEdit = (s: Student) => {
    setCurrentStudent(s);
    setNameInput(s.name);
    setClassInput(s.class_id || '');
    setStatusInput(s.status);
    setError(null);
    setEditModalOpen(true);
  };

  // Submit Edit Student
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${currentStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          class_id: classInput,
          status: statusInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui siswa.');

      setEditModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open QR Modal
  const handleOpenQr = (s: Student) => {
    setCurrentStudent(s);
    setQrModalOpen(true);
  };

  // Regenerate QR (PRD Section 12)
  const handleRegenerateQr = async () => {
    if (!currentStudent) return;
    if (
      !confirm(
        `Regenerasi QR untuk ${currentStudent.name}?\nQR lama akan LANGSUNG TIDAK VALID!`
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      const res = await fetch(`/api/admin/students/${currentStudent.id}/regenerate-qr`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setCurrentStudent((prev) => (prev ? { ...prev, qr_token: data.new_qr_token } : null));
        fetchStudents();
        alert('QR Code baru berhasil digenerate! QR lama telah dinonaktifkan.');
      } else {
        alert(data.message || 'Gagal membuat QR baru.');
      }
    } catch (e) {
      alert('Koneksi bermasalah.');
    } finally {
      setRegenerating(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPass = (s: Student) => {
    setCurrentStudent(s);
    setNewPasswordInput('student123');
    setError(null);
    setResetPassModalOpen(true);
  };

  // Submit Reset Password
  const handleResetPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !newPasswordInput.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/students/${currentStudent.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPasswordInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Password siswa ${currentStudent.name} berhasil diubah.`);
        setResetPassModalOpen(false);
      } else {
        setError(data.message || 'Gagal mereset password.');
      }
    } catch (e) {
      setError('Koneksi bermasalah.');
    } finally {
      setSaving(false);
    }
  };

  // Print QR Card
  const handlePrintQr = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Siswa</h1>
          <p className="text-xs text-slate-500 font-medium">
            Kelola identitas siswa, akun login, dan QR Code presensi unik
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Siswa Baru</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa, username, atau token QR..."
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

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
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Token QR</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{s.username}</td>
                    <td className="py-3.5 px-4 font-medium">{s.class_name}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {s.qr_token}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenQr(s)}
                          title="Lihat QR Code Siswa"
                          className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg transition"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenResetPass(s)}
                          title="Reset Password"
                          className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Data Siswa"
                          className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Tambah Siswa */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900 mb-1">Tambah Siswa Baru</h2>
            <p className="text-xs text-slate-500 mb-4">
              Akun login dan token QR unik akan digenerate otomatis
            </p>

            {error && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzan"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                  placeholder="ahmad.fauzan"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password Awal</label>
                <input
                  type="text"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                <select
                  value={classInput}
                  onChange={(e) => setClassInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Siswa */}
      {editModalOpen && currentStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900 mb-1">Edit Data Siswa</h2>
            <p className="text-xs text-slate-500 mb-4">Ubah nama, penempatan kelas, atau status</p>

            {error && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                <select
                  value={classInput}
                  onChange={(e) => setClassInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Akun</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="active">Aktif (Bisa Absen)</option>
                  <option value="disabled">Nonaktif (Ditolak Scanner)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: View & Regenerate QR Code */}
      {qrModalOpen && currentStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Card Area */}
            <div id="printable-qr-card" className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <QrCode className="w-4 h-4 text-sky-600" />
                <span className="text-[11px] font-black uppercase text-slate-800">
                  KARTU ABSENSI SKANEXA
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {currentStudent.name}
              </h3>
              <p className="text-xs font-semibold text-sky-700 mt-0.5">{currentStudent.class_name}</p>

              <div className="my-4 p-3 bg-white rounded-xl border border-slate-200 inline-block shadow-sm">
                <QRCodeSVG value={currentStudent.qr_token} size={180} level="H" includeMargin />
              </div>

              <p className="text-[11px] font-mono font-bold text-slate-500 bg-white py-1 px-2 rounded border border-slate-200 inline-block">
                {currentStudent.qr_token}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintQr}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateQr}
                  disabled={regenerating}
                  className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate QR</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400">
                Regenerasi akan membatalkan QR lama seketika.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Reset Password */}
      {resetPassModalOpen && currentStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setResetPassModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900 mb-1">Reset Password Siswa</h2>
            <p className="text-xs text-slate-500 mb-4">
              Atur ulang kata sandi login untuk <strong>{currentStudent.name}</strong>
            </p>

            {error && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

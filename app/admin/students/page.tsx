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
  Upload,
  Trash2,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react';
import { Student, ClassItem } from '@/lib/types';
import { useDialog } from '@/components/dialog-provider';

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
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkDefaultPassword, setBulkDefaultPassword] = useState('student123');
  const [bulkPreview, setBulkPreview] = useState<Array<Record<string, string>>>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);

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
  const { confirm, alert } = useDialog();

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
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      let url = `/api/admin/students?`;
      if (selectedClass !== 'all') url += `classId=${selectedClass}&`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;

      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
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
      fetchStudents();
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
    const ok = await confirm({
      title: 'Regenerasi QR Code?',
      message: `QR Code milik ${currentStudent.name} akan dibuat ulang. QR lama akan LANGSUNG TIDAK VALID.`,
      confirmText: 'Ya, regenerasi QR',
      type: 'confirm',
    });
    if (!ok) return;

    setRegenerating(true);
    try {
      const res = await fetch(`/api/admin/students/${currentStudent.id}/regenerate-qr`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setCurrentStudent((prev) => (prev ? { ...prev, qr_token: data.new_qr_token } : null));
        fetchStudents();
        await alert({ title: 'QR Code berhasil diperbarui', message: 'QR Code baru sudah aktif dan QR lama telah dinonaktifkan.', type: 'success' });
      } else {
        await alert({ title: 'Gagal membuat QR', message: data.message || 'QR Code baru tidak dapat dibuat.', type: 'error' });
      }
    } catch (e) {
      await alert({ title: 'Koneksi bermasalah', message: 'Tidak dapat terhubung ke server. Silakan coba lagi.', type: 'error' });
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
        await alert({ title: 'Password berhasil diubah', message: `Password siswa ${currentStudent.name} berhasil diperbarui.`, type: 'success' });
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

  const allSelected = students.length > 0 && selectedIds.length === students.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : students.map((s) => s.id));
  };

  const parseCsv = (text: string): Array<Record<string, string>> => {
    const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      const next = clean[i + 1];
      if (ch === '"') {
        if (quoted && next === '"') { cell += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === ',' && !quoted) {
        row.push(cell.trim()); cell = '';
      } else if (ch === '\n' && !quoted) {
        row.push(cell.trim()); cell = '';
        if (row.some((v) => v !== '')) rows.push(row);
        row = [];
      } else {
        cell += ch;
      }
    }
    row.push(cell.trim());
    if (row.some((v) => v !== '')) rows.push(row);
    if (rows.length < 2) return [];
    const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
    return rows.slice(1).map((values) => Object.fromEntries(headers.map((h, i) => [h, values[i] || ''])));
  };

  const handleBulkFile = async (file: File | null) => {
    setBulkFile(file);
    setBulkErrors([]);
    setBulkPreview([]);
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setBulkErrors(['Format file harus CSV (.csv) atau TXT dengan pemisah koma.']);
      return;
    }
    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) {
      setBulkErrors(['Data CSV tidak ditemukan. Gunakan header: nama,username,password,kelas']);
      return;
    }
    setBulkPreview(rows.slice(0, 8));
  };

  const downloadTemplate = () => {
    const csv = 'nama,username,password,kelas\nAhmad Fauzan,ahmad.fauzan,student123,XII RPL 1\nBudi Santoso,budi.santoso,student123,XII RPL 1\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-data-siswa.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) { setBulkErrors(['Pilih file CSV terlebih dahulu.']); return; }
    const text = await bulkFile.text();
    const rows = parseCsv(text);
    if (!rows.length) { setBulkErrors(['CSV kosong atau format header salah.']); return; }
    if (rows.length > 200) { setBulkErrors(['Maksimal 200 siswa per upload.']); return; }
    if (bulkDefaultPassword.length < 6) { setBulkErrors(['Password default minimal 6 karakter.']); return; }

    setBulkUploading(true);
    setBulkErrors([]);
    try {
      const res = await fetch('/api/admin/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, default_password: bulkDefaultPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengimport data siswa.');
      }
      const rowErrors = (data.errors || []).map((e: any) => `Baris ${e.row}: ${e.message}`);
      if (rowErrors.length) {
        setBulkErrors(rowErrors);
      } else {
        setBulkModalOpen(false);
      }
      setBulkFile(null);
      setBulkPreview([]);
      setSelectedIds([]);
      await fetchStudents();
      await fetchClasses();
      await alert({ title: 'Import berhasil', message: data.message || 'Data siswa berhasil diimport.', type: 'success' });
    } catch (err: any) {
      setBulkErrors([err.message || 'Koneksi bermasalah.']);
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: `Hapus ${selectedIds.length} siswa?`,
      message: 'Data akun, QR, dan riwayat presensi siswa yang dipilih juga akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, hapus siswa',
      type: 'confirm',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menghapus siswa.');
      setSelectedIds([]);
      await fetchStudents();
      await fetchClasses();
      await alert({ title: 'Siswa berhasil dihapus', message: data.message || 'Data siswa yang dipilih berhasil dihapus.', type: 'success' });
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus siswa.');
    } finally {
      setDeleting(false);
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
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? 'Menghapus...' : `Hapus ${selectedIds.length}`}</span>
            </button>
          )}
          <button
            onClick={() => { setBulkModalOpen(true); setBulkErrors([]); }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Data Siswa</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa Baru</span>
          </button>
        </div>
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
                <th className="py-3 px-4 w-10">
                  <button onClick={toggleSelectAll} type="button" title={allSelected ? 'Batalkan semua' : 'Pilih semua'}>
                    {allSelected ? <CheckSquare className="w-4 h-4 text-sky-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </button>
                </th>
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
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50/60 transition ${selectedIds.includes(s.id) ? 'bg-sky-50/60' : ''}`}>
                    <td className="py-3.5 px-4">
                      <button onClick={() => toggleSelect(s.id)} type="button">
                        {selectedIds.includes(s.id) ? <CheckSquare className="w-4 h-4 text-sky-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                    </td>
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
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Upload Data Siswa */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setBulkModalOpen(false)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900 mb-1">Upload Data Siswa</h2>
            <p className="text-xs text-slate-500 mb-4">Import banyak siswa sekaligus menggunakan file CSV.</p>

            <div className="p-3 mb-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 space-y-1">
              <p className="font-bold">Format CSV:</p>
              <p><code>nama,username,password,kelas</code></p>
              <p>Password boleh dikosongkan; sistem akan memakai password default.</p>
              <p>Nama kelas harus sudah dibuat di menu <strong>Manajemen Kelas</strong>.</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button type="button" onClick={downloadTemplate} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download Template
              </button>
              <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                <FileText className="w-3.5 h-3.5" /> Pilih CSV
                <input type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={(e) => handleBulkFile(e.target.files?.[0] || null)} />
              </label>
              {bulkFile && <span className="self-center text-xs font-medium text-slate-600">{bulkFile.name}</span>}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Password Default</label>
              <input type="text" value={bulkDefaultPassword} onChange={(e) => setBulkDefaultPassword(e.target.value)} className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono" />
            </div>

            {bulkPreview.length > 0 && (
              <div className="mb-4 border border-slate-200 rounded-xl overflow-x-auto">
                <div className="px-3 py-2 bg-slate-50 text-xs font-bold text-slate-700">Preview maksimal 8 baris</div>
                <table className="w-full text-xs">
                  <thead className="bg-white border-b border-slate-100"><tr><th className="p-2 text-left">Nama</th><th className="p-2 text-left">Username</th><th className="p-2 text-left">Kelas</th></tr></thead>
                  <tbody>{bulkPreview.map((r, i) => <tr key={i} className="border-b border-slate-50"><td className="p-2">{r.nama || '-'}</td><td className="p-2 font-mono">{r.username || '-'}</td><td className="p-2">{r.kelas || '-'}</td></tr>)}</tbody>
                </table>
              </div>
            )}

            {bulkErrors.length > 0 && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl space-y-1 max-h-40 overflow-y-auto">
                {bulkErrors.map((item, i) => <p key={i}>{item}</p>)}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setBulkModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs">Batal</button>
              <button type="button" onClick={handleBulkUpload} disabled={bulkUploading || !bulkFile} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs disabled:opacity-50">
                {bulkUploading ? 'Mengimport...' : 'Import Data Siswa'}
              </button>
            </div>
          </div>
        </div>
      )}

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

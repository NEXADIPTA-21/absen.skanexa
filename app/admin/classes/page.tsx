'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit2, CheckCircle2, XCircle, Search, RefreshCw, X, Trash2, CheckSquare, Square } from 'lucide-react';
import { ClassItem } from '@/lib/types';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClassItem | null>(null);
  const [classNameInput, setClassNameInput] = useState('');
  const [statusInput, setStatusInput] = useState<'active' | 'disabled'>('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    setClassNameInput('');
    setStatusInput('active');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ClassItem) => {
    setEditItem(item);
    setClassNameInput(item.name);
    setStatusInput(item.status);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) {
      setError('Nama kelas tidak boleh kosong.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editItem) {
        // Edit
        const res = await fetch(`/api/admin/classes/${editItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: classNameInput.trim(), status: statusInput }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengubah kelas');
      } else {
        // Add
        const res = await fetch('/api/admin/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: classNameInput.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Gagal membuat kelas');
      }

      setModalOpen(false);
      fetchClasses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const allSelected = classes.length > 0 && selectedIds.length === classes.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : classes.map((c) => c.id));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const selected = classes.filter((c) => selectedIds.includes(c.id));
    const withStudents = selected.filter((c) => (c.student_count || 0) > 0);
    const warning = withStudents.length > 0
      ? `\n\n${withStudents.length} kelas masih memiliki siswa. Siswa TIDAK akan dihapus, tetapi kelasnya akan menjadi "Belum ada kelas".`
      : '';

    if (!confirm(`Hapus ${selectedIds.length} kelas yang dipilih?${warning}\n\nTindakan ini tidak dapat dibatalkan.`)) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menghapus kelas.');
      setSelectedIds([]);
      await fetchClasses();
      alert(data.message || 'Kelas berhasil dihapus.');
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus kelas.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Kelas</h1>
          <p className="text-xs text-slate-500 font-medium">
            Kelola daftar kelas aktif dan pembagian rombel siswa SKANEXA
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
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas Baru</span>
          </button>
        </div>
      </div>

      {/* Classes List */}
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
                <th className="py-3 px-4">Nama Kelas</th>
                <th className="py-3 px-4">Jumlah Siswa</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Memuat data kelas...
                  </td>
                </tr>
              ) : classes.length > 0 ? (
                classes.map((c) => (
                  <tr key={c.id} className={`hover:bg-slate-50/60 transition ${selectedIds.includes(c.id) ? 'bg-sky-50/60' : ''}`}>
                    <td className="py-3.5 px-4">
                      <button onClick={() => toggleSelect(c.id)} type="button">
                        {selectedIds.includes(c.id) ? <CheckSquare className="w-4 h-4 text-sky-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{c.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {c.student_count || 0} Siswa
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.status === 'active' ? (
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
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada data kelas yang dibuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Class */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">
              {editItem ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {editItem ? 'Ubah informasi atau status kelas' : 'Masukkan nama kelas baru'}
            </p>

            {error && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  placeholder="Contoh: XII RPL 1"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                  autoFocus
                />
              </div>

              {editItem && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Kelas</label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="disabled">Nonaktif</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

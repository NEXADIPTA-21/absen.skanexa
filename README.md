# Absen SKANEXA v1.0

> **Sistem Presensi Siswa Cepat Berbasis QR Code SMK Negeri 1 Kandeman**  
> *Target Domain:* `absen.skanexa-21.my.id` | *Hosting:* Vercel | *Database:* Supabase PostgreSQL | *Timezone:* Asia/Jakarta (WIB)

---

## 1. Ringkasan & Prinsip Utama

Absen SKANEXA dirancang khusus untuk memenuhi standar performa tinggi:
```text
SCAN → VERIFY → SUCCESS → READY → SCAN NEXT STUDENT
```

### Keunggulan Kunci:
1. **Kecepatan Tinggi (Target 300–700 ms)**: Pemindaian kamera tidak memuat ulang halaman, kamera tidak pernah mati/restart antar siswa.
2. **Anti-Duplikasi Kuat**: Kombinasi constraint database `UNIQUE(student_id, attendance_date)` dan scanner debouncing (`last_scanned_token` + interval waktu).
3. **Pemisahan Peran Tegas (RBAC)**:
   - **Admin**: Akses penuh mengelola siswa, kelas, petugas, jadwal masuk/pulang, koreksi manual, audit log, dan export CSV.
   - **Sie Keamanan**: Pemindai kamera presensi (Check In & Check Out) super responsif dengan umpan balik audio sintesis dan visual instan.
   - **Siswa**: Melihat kartu digital, QR Code pribadi beresolusi tinggi, dan status absensi harian (WIB). Siswa **tidak** dapat melakukan scan mandiri.
4. **Keamanan Token QR**: Format token acak kriptografis `SKNX-ATT-XXXXXXXXXXXXXXXX` (16 karakter alfanumerik) tanpa data pribadi sensitif di dalam QR. Jika hilang, Admin dapat men-generate ulang (invalidasi instan).

---

## 2. Kredensial Akun Bawaan (Demo)

Sistem sudah dilengkapi akun uji coba siap pakai:

| Role | Username | Password | Deskripsi / Hak Akses |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Akses penuh dashboard, manajemen siswa/kelas, laporan, audit |
| **Sie Keamanan** | `security01` | `security123` | Scanner kamera gerbang sekolah (Check In & Check Out) |
| **Siswa** | `ahmad.fauzan` | `student123` | Siswa XII RPL 1 (Kartu QR Token: `SKNX-ATT-8891AF2491CB8821`) |
| **Siswa** | `budi.santoso` | `student123` | Siswa XII RPL 1 (Kartu QR Token: `SKNX-ATT-7729BD4812EF9012`) |
| **Siswa** | `citra.lestari` | `student123` | Siswa XII RPL 2 (Kartu QR Token: `SKNX-ATT-6618CD7933FA1145`) |

---

## 3. Menjalankan di Lokal (Local Development)

Sistem memiliki *Dual-Mode Architecture*: Dapat langsung dijalankan secara lokal dengan penyimpanan lokal otomatis, maupun terhubung langsung ke Supabase PostgreSQL di cloud.

1. Buka terminal di folder project:
   ```bash
   cd absen-skanexa
   ```

2. Jalankan development server:
   ```bash
   npm run dev
   ```

3. Buka browser:
   - Halaman Login: [http://localhost:3000](http://localhost:3000)
   - Kartu Siswa: [http://localhost:3000/student](http://localhost:3000/student)
   - Scanner Keamanan: [http://localhost:3000/security](http://localhost:3000/security)
   - Dashboard Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 4. Konfigurasi Supabase PostgreSQL

1. Buat project baru di [supabase.com](https://supabase.com).
2. Masuk ke menu **SQL Editor**, buka file `supabase/schema.sql` dari project ini, lalu salin dan jalankan seluruh query SQL tersebut.
3. Masuk ke **Project Settings** -> **API**, lalu salin:
   - `Project URL`
   - `anon public key`
   - `service_role key` (rahasia server)
4. Buat file `.env.local` atau tambahkan di Environment Variables Vercel:
   ```env
   APP_TIMEZONE=Asia/Jakarta
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   APP_SECRET=your-random-production-secret-key
   ```

---

## 5. Panduan Deployment ke Vercel & Subdomain

### Langkah Deployment ke Vercel:
1. Hubungkan repository GitHub Anda ke Vercel.
2. Tambahkan Environment Variables yang ada di `.env.example` ke pengaturan Environment Vercel.
3. Klik **Deploy**.

### Konfigurasi Custom Domain `absen.skanexa-21.my.id`:
1. Di dashboard project Vercel, buka tab **Settings** -> **Domains**.
2. Masukkan domain: `absen.skanexa-21.my.id` lalu klik **Add**.
3. Buka DNS Management penyedia domain `skanexa-21.my.id` (misalnya Cloudflare, Rumahweb, Niagahoster):
   - **Type**: `CNAME`
   - **Name / Host**: `absen`
   - **Target / Value**: `cname.vercel-dns.com`
   - **TTL**: `Auto` atau `3600`
4. Tunggu beberapa saat hingga sertifikat SSL Vercel otomatis aktif.
5. Aplikasi siap diakses secara resmi di `https://absen.skanexa-21.my.id`!

---

## 6. Struktur Direktori Proyek

```text
absen-skanexa/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── attendance/         # Presensi harian & koreksi manual (audit logged)
│   │   │   ├── audit-logs/         # Audit trail rekam jejak
│   │   │   ├── classes/            # Manajemen kelas
│   │   │   ├── dashboard/          # Realtime KPI dashboard
│   │   │   ├── reports/            # Laporan & export CSV
│   │   │   ├── security/           # Manajemen akun petugas keamanan
│   │   │   ├── settings/           # Pengaturan jam masuk & toleransi terlambat
│   │   │   └── students/           # CRUD siswa, reset pass, regenerate QR
│   │   ├── attendance/
│   │   │   └── scan/               # Endpoint Scanner cepat (POST /api/attendance/scan)
│   │   ├── auth/                   # Login, logout, session me
│   │   └── student/                # Identitas siswa & status hari ini
│   ├── admin/                      # UI Admin Panel (Responsive)
│   ├── student/                    # UI Mobile-first Kartu QR Siswa
│   ├── security/                   # UI Scanner Kamera Sie Keamanan
│   ├── login/                      # UI Autentikasi
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts                     # Password hashing (bcrypt) & session cookie
│   ├── db.ts                       # Abstraction layer (Supabase PostgreSQL + seed)
│   ├── qr.ts                       # Format SKNX-ATT-XXXXXXXXXXXXXXXX token
│   ├── supabase.ts                 # Inisialisasi client Supabase
│   ├── time.ts                     # Kalkulasi status (Asia/Jakarta / WIB)
│   └── types.ts                    # TypeScript types
├── supabase/
│   └── schema.sql                  # Skrip SQL lengkap (Index, Constraints, Seed)
└── package.json
```

---

## 7. Status Acceptance Criteria (PRD v1.0)

- [x] Sistem autentikasi berbasis role (Admin, Keamanan, Siswa) tanpa registrasi mandiri siswa.
- [x] Password tersimpan dalam bentuk hash kriptografis yang aman (bcrypt), tidak pernah dalam plaintext.
- [x] Token QR unik tidak berurutan berformat `SKNX-ATT-XXXXXXXXXXXXXXXX`.
- [x] Tombol Regenerasi QR instan yang membatalkan token QR lama.
- [x] Scanner kamera gerbang sekolah tanpa reload halaman, kamera terus hidup, feedback audio & visual cepat.
- [x] Tombol beralih Check In dan Check Out yang jelas dan mudah ditekan di smartphone.
- [x] Penolakan duplikasi scan dan penolakan Check Out jika belum Check In.
- [x] Penentuan otomatis status Hadir / Terlambat berdasarkan batas toleransi waktu WIB.
- [x] Dashboard Admin dengan 5 metrik utama (Total Siswa, Check In, Terlambat, Belum Absen, Check Out).
- [x] Koreksi manual presensi oleh Admin yang otomatis tercatat dalam Audit Log.
- [x] Fitur export laporan ke format CSV ber-BOM UTF-8 siap pakai di Excel.
- [x] Skrip database Supabase PostgreSQL lengkap dengan index performa tinggi dan constraint `UNIQUE(student_id, attendance_date)`.

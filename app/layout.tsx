import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Absen SKANEXA - Presensi QR Code Siswa',
  description: 'Sistem Absensi Siswa Cepat Berbasis QR Code SMK Negeri 1 Kandeman (SKANEXA)',
  keywords: ['absen skanexa', 'presensi qr code', 'skanexa', 'absensi siswa cepat'],
  authors: [{ name: 'Tim SKANEXA' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0284c7',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-50 text-slate-900 select-none selection:bg-sky-200">
        {children}
      </body>
    </html>
  );
}

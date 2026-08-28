# opaknew

Project ini sudah disiapkan sebagai aplikasi Next.js dengan fitur akun, login, saldo token, dan penukaran kode memakai Prisma + PostgreSQL.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Setup Database

1. Salin `.env.example` menjadi `.env`.
2. Isi `DATABASE_URL` dengan koneksi PostgreSQL.
3. Isi `JWT_SECRET` dengan string random minimal 32 karakter.
4. Jalankan migrasi:

```bash
npm run db:migrate -- --name init
```

5. Buat kode redeem:

```bash
npm run code:create -- OCR-TEST-100 100
```

## Route Aplikasi

- `/login` untuk masuk
- `/register` untuk daftar akun
- `/dashboard` untuk melihat saldo token dan menukarkan kode

Landing lama tetap tersedia di halaman utama.

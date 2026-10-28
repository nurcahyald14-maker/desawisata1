# Website Wisata Gunung

Website HTML + CSS + JavaScript (vanilla) dengan backend Supabase.
Halaman pengunjung (`index.html`) dan panel admin terhubung real-time.

## Struktur

```
wisata-gunung/
├── index.html            Halaman user
├── admin-login.html      Login admin (Supabase Auth)
├── admin-dashboard.html  Dashboard admin
├── schema.sql            Tabel, RLS, real-time, data awal
├── (CSS sudah tertanam langsung di dalam setiap file HTML)
├── js/    main.js · whatsapp.js · supabase-config.js · admin.js
└── assets/ video/ · images/ · icons/
```

## Langkah setup

1. **Buat proyek** di https://supabase.com.
2. **Jalankan `schema.sql`** di SQL Editor (membuat tabel `packages`, `gallery`, `team`, `settings`, `bookings`, kebijakan RLS, dan data awal).
3. **Buat akun admin**: Authentication → Users → Add user (isi email & password, centang auto-confirm). Matikan pendaftaran publik di Authentication → Sign In / Providers → nonaktifkan "Allow new users to sign up" agar hanya akun Anda yang bisa login.
4. **Isi kunci API**: salin Project URL dan anon public key (Project Settings → API) ke `js/supabase-config.js`.
5. **Video hero**: simpan video gunung sebagai `assets/video/hero.mp4` (disarankan di bawah 8 MB). Tanpa video, situs memakai gambar latar.
6. **Jalankan lokal**: buka lewat server statis, mis. `npx serve .` atau ekstensi Live Server VS Code. Lalu hosting di Netlify / Vercel / GitHub Pages.
7. Login di `admin-login.html`, buka tab **Info Wisata**, dan ganti nomor WhatsApp tujuan booking.

## Catatan penting

- Sebelum `supabase-config.js` diisi, situs menampilkan **data contoh** agar tampilan bisa dilihat; admin tidak bisa login.
- Keamanan data dijaga oleh **Row Level Security**, bukan oleh pengecekan di browser: publik hanya boleh membaca konten dan menambah log booking, sedangkan menulis/menghapus hanya untuk user yang login.
- Kolom tambahan di tabel `settings` (address, phone, email, instagram, facebook, maps_embed) melengkapi spesifikasi awal agar kontak, media sosial, dan peta bisa diubah dari dashboard.
- Tabel `bookings` ditambahkan untuk fitur Log Riwayat Booking. Yang tercatat adalah **klik/niat booking**, bukan transaksi yang terkonfirmasi.
- Foto dan video galeri berupa **link URL**. Untuk upload file langsung, Anda bisa memakai Supabase Storage lalu menempelkan URL publiknya.
- Jangan pernah memakai `service_role` key di file frontend; hanya anon key.

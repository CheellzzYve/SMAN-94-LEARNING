# SMAN94 LEARNING — Panduan Build APK

Project ini sudah disiapkan dalam bentuk **Capacitor project**, dan sudah
dilengkapi workflow **GitHub Actions** yang akan otomatis meng-compile-kan
menjadi file **.apk** — kamu tidak perlu install Android Studio atau apapun
di laptop. Semua proses build terjadi di server GitHub (gratis).

## Langkah-langkah

### 1. Buat akun GitHub (jika belum punya)
Daftar gratis di https://github.com/signup

### 2. Buat repository baru
1. Klik tombol **New repository** di github.com
2. Beri nama misalnya `sman94-learning`
3. Pilih **Public** (biar dapat jatah GitHub Actions gratis tanpa batas)
4. Klik **Create repository**

### 3. Upload folder project ini ke repository
Di halaman repository yang baru dibuat:
1. Klik **uploading an existing file**
2. Seret (drag & drop) **semua isi folder ini** (termasuk folder `.github`,
   `www`, dan file `package.json`, `capacitor.config.json`) ke halaman itu
3. Klik **Commit changes**

> Catatan: folder `.github` kadang tersembunyi di file explorer. Pastikan
> ikut ter-upload — ini folder yang berisi instruksi build otomatis.

### 4. Jalankan proses build
1. Buka tab **Actions** di repository kamu
2. Klik workflow **Build Android APK** di sebelah kiri
3. Klik tombol **Run workflow** → **Run workflow** (hijau)
4. Tunggu 3–5 menit sampai muncul tanda centang hijau ✅

### 5. Download APK-nya
1. Klik hasil run yang sudah selesai (tanda centang hijau)
2. Scroll ke bagian bawah, ada bagian **Artifacts**
3. Klik **sman94-learning-apk** untuk download (dalam bentuk .zip)
4. Extract zip-nya → di dalamnya ada file **app-debug.apk**
5. Pindahkan APK itu ke HP Android kamu dan install
   (mungkin perlu aktifkan "Izinkan install dari sumber tidak dikenal"
   di pengaturan HP)

## Tentang aplikasi ini

Aplikasi ini menyimpan semua data (guru, siswa, ruang ujian, log) di
**localStorage** perangkat itu sendiri — bukan di server online. Artinya:
- Data hanya tersimpan di HP tempat aplikasi itu diinstall dan dipakai
- Kalau di-uninstall, data akan hilang
- Data tidak otomatis sinkron antar HP/perangkat berbeda

Kalau nanti kamu butuh data yang bisa diakses dari banyak HP sekaligus
(misalnya guru pantau dari HP-nya, siswa kerjakan dari HP mereka), itu
perlu backend server + database sungguhan — beda cerita dari versi ini.

## Update aplikasi di kemudian hari

Kalau ada perubahan di `www/index.html`, `www/css/style.css`, atau
`www/js/app.js`, cukup upload ulang (replace) file yang berubah ke
repository GitHub, lalu jalankan lagi workflow **Build Android APK** dari
tab Actions untuk dapat APK versi terbaru.

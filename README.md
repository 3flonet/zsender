# ✉️ ZSender

<p align="center">
  <b>Platform Email Marketing & WhatsApp Business Multi-Tenant Mandiri (Self-Hosted)</b>
  <br>
  <i>Alternatif Open-Source untuk Mailchimp, SendGrid & WABA Marketing tanpa biaya langganan software per kontak.</i>
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge">
  <img alt="Developer" src="https://img.shields.io/badge/Developed%20By-Khair%20Studio-ab1757?style=for-the-badge">
  <img alt="Node.js 22 LTS" src="https://img.shields.io/badge/Node.js-22_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react&logoColor=white">
  <img alt="Express 5" src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white">
  <img alt="PostgreSQL 16" src="https://img.shields.io/badge/PostgreSQL-16-4169e1?style=for-the-badge&logo=postgresql&logoColor=white">
  <img alt="Redis 7" src="https://img.shields.io/badge/Redis-7-dc382d?style=for-the-badge&logo=redis&logoColor=white">
  <img alt="Amazon SES" src="https://img.shields.io/badge/Email-Amazon_SES-dd344c?style=for-the-badge&logo=amazonsimpleemailservice&logoColor=white">
  <img alt="WhatsApp Official" src="https://img.shields.io/badge/WhatsApp-Meta_Cloud_API-25d366?style=for-the-badge&logo=whatsapp&logoColor=white">
  <img alt="Multi-Tenant" src="https://img.shields.io/badge/Architecture-Multi--Tenant-6366f1?style=for-the-badge">
  <img alt="Docker Ready" src="https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&logo=docker&logoColor=white">
</p>

---

## 📌 Daftar Isi

- [Tentang ZSender](#-tentang-zsender)
- [Mengapa Memilih ZSender?](#-mengapa-memilih-zsender)
- [Perbandingan dengan Layanan Berlangganan](#-perbandingan-dengan-layanan-berlangganan)
- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#️-arsitektur-sistem)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Panduan Instalasi & Menjalankan Lokal (Quickstart)](#-panduan-instalasi--menjalankan-lokal-quickstart)
- [Panduan Konfigurasi Amazon SES](#-panduan-konfigurasi-amazon-ses)
- [Panduan Konfigurasi WhatsApp Business (Meta Cloud API)](#-panduan-konfigurasi-whatsapp-business-meta-cloud-api)
- [Panduan Deployment ke Server VPS (Production)](#-panduan-deployment-ke-server-vps-production)
- [Akun & Kredensial Bawaan](#-akun--kredensial-bawaan)
- [Struktur Folder Proyek](#-struktur-folder-proyek)
- [Konfigurasi Lingkungan (Environment Variables)](#-konfigurasi-lingkungan-environment-variables)
- [Pengembang & Lisensi](#-pengembang--lisensi)

---

## 💡 Tentang ZSender

**ZSender** adalah platform *email marketing* dan *campaign engine* berskala enterprise yang dirancang khusus untuk berjalan secara mandiri (*self-hosted*) di server/VPS Anda sendiri. 

Dibangun di atas infrastruktur **Amazon Simple Email Service (SES)**, ZSender memungkinkan Anda atau klien Anda (multi-tenant) untuk:
- Mengirim jutaan email dengan biaya sangat murah (~Rp 1.600 per 1.000 email).
- Membawa dan memverifikasi domain pengirim sendiri (*Bring Your Own Domain*).
- Mengelola kontak, tag, custom field, dan segmentasi dinamis.
- Mendesain template email responsif dengan *merge tags* aman.
- Menjadwalkan dan melacak status pengiriman secara *real-time* (delivery, bounce, open pixel, click redirect).
- Melindungi reputasi pengiriman dari pemblokiran spam secara otomatis (*Reputation Gate*).

ZSender dikembangkan dan disesuaikan oleh **Khair Studio** untuk memberikan kebebasan penuh atas data audience Anda tanpa terkunci (*vendor lock-in*) oleh biaya langganan SaaS bulanan yang mahal.

---

## 🚀 Mengapa Memilih ZSender?

Kebanyakan layanan pengiriman email populer seperti Mailchimp atau SendGrid mengenakan biaya berbasis **jumlah kontak** yang tersimpan di database mereka. Semakin besar audiens Anda, semakin mahal tagihan bulanannya—meskipun Anda jarang mengirim email.

Di sisi lain, Amazon SES menawarkan biaya pengiriman email termurah di dunia, tetapi SES hanyalah "pipa mentah" tanpa antarmuka grafis, tanpa pembuat template, tanpa daftar kontak, dan tanpa otomasi reputasi.

**ZSender hadir sebagai solusi penjembatan:**
1. **100% Kepemilikan Data:** Semua data audiens dan metrik tersimpan di database PostgreSQL milik Anda sendiri.
2. **Tanpa Batas Kontak Buatan:** Simpan ratusan ribu kontak tanpa kenaikan biaya lisensi software.
3. **Multi-Tenancy Sejati:** Dapat digunakan untuk banyak klien atau banyak unit usaha dalam satu instalasi tunggal. Setiap workspace memiliki data, domain, dan kuota yang terisolasi penuh.
4. **Proteksi Reputasi Otomatis:** Sistem proteksi cerdas yang otomatis menghentikan pengiriman jika *bounce rate* atau *complaint rate* melebihi batas toleransi, menjaga akun SES tetap aman dari suspend.

---

## 📊 Perbandingan dengan Layanan Berlangganan

| Kategori | Mailchimp / SendGrid | ZSender by Khair Studio |
| :--- | :---: | :---: |
| **Model Biaya Software** | Langganan Bulanan (Rp 300rb – Rp 5jt+/bln) | **Rp 0 (Gratis Selamanya, Lisensi MIT)** |
| **Biaya per Jumlah Kontak** | Makin banyak kontak, makin mahal | **Gratis (Unlimited)** |
| **Biaya Kirim Email** | Terbatas kuota paket | **Pay-as-you-go Amazon SES (~$0.10 / 1.000 email)** |
| **Lokasi Data** | Server Pihak Ketiga | **Server / VPS Anda Sendiri** |
| **Multi-Tenant (Banyak Klien)** | Dikenakan paket terpisah / Add-on mahal | **Tersedia Bawaan (*Out-of-the-box*)** |
| **Verifikasi Domain Klien** | Terbatas | **Otomatis via DKIM, SPF, DMARC, CNAME** |

---

## ✨ Fitur Utama

### 🏢 1. Multi-Tenancy & Isolasi Data Penuh
- Setiap tabel basis data mengikat `tenant_id` secara ketat dengan `ON DELETE CASCADE`.
- Tenant A tidak akan pernah bisa mengakses atau melihat data milik Tenant B.
- Sistem *Role-Based Access Control* (RBAC): Admin, Marketer, Analyst, dan kustom role.

### 🌐 2. Onboarding Domain Pengirim Mandiri (BYOD)
- Setiap workspace dapat menambahkan subdomain pengirim sendiri (contoh: `mail.perusahaananda.com`).
- Menghasilkan record DNS otomatis:
  - **3 Record CNAME DKIM** (Easy DKIM).
  - **1 Record MX & 1 Record TXT SPF** untuk *Custom MAIL FROM*.
  - **1 Record TXT DMARC**.
  - **1 Record CNAME Tracking** untuk tautan kustom.
- Pengecekan otomatis berkala oleh sistem background untuk mendeteksi propagasi DNS.

### 👥 3. Manajemen Audience Cerdas
- **Kontak & Atribut Fleksibel:** Menyimpan status (`SUBSCRIBED`, `UNSUBSCRIBED`, `BOUNCED`), custom fields tak terbatas, dan tags (berindeks PostgreSQL GIN).
- **Segmentasi Dinamis Berbasis SQL:** Filter kontak dievaluasi langsung menggunakan query SQL tingkat tinggi, bukan di-loop di memori server.
- **Import CSV Aman:** Menghindari kontak yang sudah *unsubscribed* atau *bounced* diaktifkan kembali secara tidak sengaja (*anti-resurrection*).
- **Formulir Berlangganan Mandiri:** Formulir pendaftaran hosted dengan dukungan verifikasi *Double Opt-in*.

### 🎨 4. Template & Campaign Composer
- Pembuat kampanye 4 langkah: **Setup ➔ Audience ➔ Content ➔ Preflight & Schedule**.
- *Preflight Checks*: Sistem memvalidasi apakah kuota mencukupi, domain pengirim berstatus `VERIFIED`, reputasi aman, dan tombol unsubscribe tersedia sebelum email diizinkan terkirim.
- *Merge Tags Aman:* Mendukung variabel personalisasi seperti `{{first_name | default: 'Pelanggan'}}`.
- Tersedia 8 *starter template* profesional siap pakai.

### 📈 5. Pelacakan & Laporan Transparan
- **Pelacakan Buka (Open Tracking):** Menggunakan piksel transparan 1x1. Sistem mampu mendeteksi *Machine Opens* (seperti Apple Mail Privacy Protection dan Google Image Proxy) agar metrik pembacaan tetap jujur.
- **Pelacakan Klik (Click Tracking):** Link dibungkus ke endpoint redirect aman bertanda tangan digital (*signed token*).
- **Proteksi Unsubscribe dari Bot Antivirus:** Link unsubscribe tidak langsung membatalkan langganan saat diakses bot scanner, melainkan membutuhkan konfirmasi eksplisit (POST) atau via standar RFC 8058 (One-Click Unsubscribe header).

### 🛡️ 6. Sistem Gerbang Reputasi (*Reputation Gate*)
- Menghitung rasio bounce dan komplain secara *rolling 14 hari*.
- Status kesehatan: **`ACTIVE` ➔ `WARNING` ➔ `THROTTLED` ➔ `PAUSED`**.
- Mencegah satu tenant yang buruk merusak reputasi akun Amazon SES utama.

### 🎛️ 7. Operator Console (Panel Pemilik Platform)
- Portal terpisah (`apps/console`) khusus untuk administrator sistem:
  - Manajemen master paket (*Plans*) dan batas kuota email bulanan.
  - Manajemen Email Provider (Amazon SES, Custom SMTP, Simulated) langsung dari antarmuka UI tanpa menyentuh file `.env`.
  - Pemantauan kesehatan armada seluruh tenant (*Fleet Reputation*).
  - Monitoring antrean pesan gagal (*Dead-Letter Queue / DLQ*).

### 💬 8. WhatsApp Business Official (Meta Cloud API) & Live Chat Dua Arah
- **Integrasi Resmi Meta Cloud API (Opsi A - Multi-Tenant):** Setiap tenant / klien dapat menghubungkan nomor WhatsApp Bisnis dan WABA (*WhatsApp Business Account*) mereka masing-masing secara terenkripsi (AES-256-GCM).
- **Two-Way Live Chat Inbox:** Antarmuka percakapan bergaya WhatsApp Web interaktif untuk membalas pesan masuk pelanggan secara langsung (*live real-time*).
- **Pesan Broadcast Kampanye:** Mengirimkan pesan promosi atau pemberitahuan massal ke daftar kontak menggunakan template WhatsApp resmi.
- **Manajemen Template:** Mendukung pembuatan dan penyimpanan template pesan resmi dengan variabel dinamis (`{{1}}`, `{{2}}`).
- **Webhook Dua Arah & Simulator Mandiri:** Mendukung Webhook Meta Graph API untuk status pengiriman (*sent, delivered, read*) serta fitur Simulator pesan masuk untuk pengujian lokal tanpa membutuhkan nomor fisik.

---

## 🏗️ Arsitektur Sistem

```mermaid
flowchart TD
    subgraph Pengguna
        U1["Tenant Staff (Aplikasi Web)"]
        U2["Platform Operator (Console)"]
        U3["Penerima Email (Client/Browser)"]
        U4["Pelanggan WhatsApp (Mobile App)"]
    end

    subgraph ZSender Core Platform
        WEB["Portal Tenant (apps/web) - Port 3650"]
        CONSOLE["Operator Console (apps/console) - Port 3660"]
        API["Backend API & Worker (apps/api) - Port 5126"]
        PG[("PostgreSQL 16")]
        REDIS[("Redis 7 - BullMQ")]
    end

    subgraph Layanan Eksternal
        SES["Amazon SES v2 (Pengiriman Email)"]
        META["Meta Cloud API (WhatsApp Official)"]
        SNS_SQS["Amazon SNS & SQS (Event Feedback)"]
        DNS["DNS Provider Anda (Cloudflare, cPanel, dll)"]
    end

    U1 -->|Bearer JWT| WEB
    U2 -->|Bearer Operator JWT| CONSOLE
    WEB --> API
    CONSOLE --> API
    API --> PG
    API --> REDIS
    API -->|SendEmail + Configuration Sets| SES
    SES -->|Kirim Email| U3
    U3 -->|Open Pixel / Click Tracking / Unsub| API
    SES -->|Delivery, Bounce, Complaint Events| SNS_SQS
    SNS_SQS -->|Long Poll Consumer| API
    API -.->|Verifikasi DKIM / SPF| DNS
    API -->|Messages & Templates| META
    META -->|Kirim Chat & Template| U4
    U4 -->|Balas Pesan Pelanggan| META
    META -->|Webhook Inbound & Delivery Status| API
```

---

## 🧰 Teknologi yang Digunakan

| Lapisan | Teknologi |
| :--- | :--- |
| **Frontend Tenant & Console** | React 19, Vite, TanStack Query 5, Tailwind CSS, Radix UI, Zustand, Lucide Icons |
| **Backend API** | Node.js 22 LTS, Express 5, TypeScript (Strict Mode) |
| **Basis Data** | PostgreSQL 16 dengan query builder Kysely (Type-safe & High Performance) |
| **Job Queue & Cache** | Redis 7 & BullMQ (Pengiriman batch non-blocking, scheduler 30 detik) |
| **Email Infrastructure** | AWS SES v2 SDK, SNS, SQS, DKIM, Custom MAIL FROM |
| **Deployment & Container** | Docker, Docker Compose, Nginx Unprivileged, Terraform (AWS Production) |

---

## 🚀 Panduan Instalasi & Menjalankan Lokal (Quickstart)

Anda dapat menjalankan ZSender secara lokal di komputer/laptop menggunakan **Docker Desktop** tanpa memerlukan akun AWS (menggunakan mode simulasi bawaan).

### 1. Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) sudah terinstal dan aktif.
- Git.

### 2. Clone Repository
```bash
git clone https://github.com/3flonet/zsender.git
cd zsender
```

### 3. Jalankan Stack Container
Jalankan perintah berikut di PowerShell atau Terminal:

```powershell
docker compose --env-file deploy/compose/.env -f deploy/compose/compose.yaml -f deploy/compose/compose.floci.yaml up -d --build
```
*(Proses download dan build container membutuhkan waktu sekitar 2–3 menit pada eksekusi pertama).*

### 4. Eksekusi Seeder Data Awal
Setelah seluruh container berstatus aktif (*Healthy*), jalankan perintah ini untuk membuat akun operator dan workspace bersih Khair Studio:

```powershell
docker compose --env-file deploy/compose/.env -f deploy/compose/compose.yaml -f deploy/compose/compose.floci.yaml exec api node dist-scripts/scripts/seed.js --force
```

### 5. Akses Melalui Browser
Setelah selesai, buka browser Anda:

| Antarmuka | URL Browser | Fungsi |
| :--- | :--- | :--- |
| **ZSender Tenant App** | [http://localhost:3650](http://localhost:3650) | Portal utama pengguna (buat kampanye, kelola kontak, buat template) |
| **ZSender Operator Console** | [http://localhost:3660](http://localhost:3660) | Panel kontrol admin platform (kelola paket, kuota, armada tenant) |
| **Mailpit Web UI** | [http://localhost:8126](http://localhost:8126) | Kotak masuk simulasi lokal (menangkap semua email uji coba) |
| **API Health Check** | [http://localhost:5126/api/health](http://localhost:5126/api/health) | Status kesehatan backend API |

---

## ☁️ Panduan Konfigurasi Amazon SES

Untuk beralih dari mode simulasi lokal ke pengiriman email sungguhan, Anda perlu menghubungkan ZSender ke akun **Amazon Simple Email Service (SES)**.

### Langkah 1: Buat Akun AWS & Tentukan Region
1. Buka [AWS Console](https://aws.amazon.com/) dan buat akun AWS (tersedia *Free Tier*).
2. Pilih Region SES yang Anda inginkan (disarankan: **`ap-southeast-1`** untuk Singapura, atau **`us-east-1`** untuk N. Virginia).
   > *Catatan: Gunakan satu region yang sama untuk semua konfigurasi.*

### Langkah 2: Buat Kredensial IAM User
1. Buka layanan **IAM (Identity and Access Management)** di konsol AWS.
2. Pilih **Users** ➔ **Create user** (misal beri nama: `zsender-sender-user`).
3. Pada tab izin (*Permissions*), pilih **Attach policies directly**, lalu tambahkan:
   - **`AmazonSESFullAccess`** (untuk pengiriman email dan otomasi DKIM/Domain).
   - *(Opsional)* **`AmazonSQSFullAccess`** & **`AmazonSNSFullAccess`** (jika ingin feedback loop bounce/complaint otomatis).
4. Selesaikan pembuatan user, lalu buka tab **Security credentials** pada user tersebut.
5. Klik **Create access key** ➔ Pilih **Application running outside AWS**.
6. Simpan nilai **Access Key ID** (`AWS_SES_ACCESS_KEY`) dan **Secret Access Key** (`AWS_SES_SECRET_KEY`) Anda.

### Langkah 3: Verifikasi Identitas Pengirim Utama (Platform Sender)
ZSender membutuhkan satu email sistem untuk mengirim email undangan tim dan reset password:
1. Masuk ke **Amazon SES Console** ➔ **Configuration** ➔ **Identities**.
2. Klik **Create identity** ➔ Pilih **Email address** atau **Domain** (misal: `admin@domainanda.com` atau domain Anda).
3. Buka inbox email tersebut dan klik link konfirmasi dari AWS.
4. Nilai ini yang akan Anda masukkan ke variabel `AWS_SES_FROM_EMAIL`.

### Langkah 4: Ajukan Pembukaan Sandbox (Request Production Access)
Secara bawaan, semua akun AWS SES baru berada dalam status **Sandbox** (hanya bisa kirim ke email yang telah diverifikasi secara manual). Untuk mengirim email ke audiens umum:
1. Di SES Console, buka menu **Account dashboard**.
2. Klik tombol **Request production access** di bagian atas.
3. Isi formulir dengan jujur:
   - **Mail type:** Marketing / Transactional.
   - **Website URL:** Alamat website perusahaan Anda.
   - **Use Case Description:** Jelaskan bahwa Anda menggunakan ZSender untuk mengirim newsletter/promosi resmi ke pelanggan yang sudah berlangganan secara sukarela (*opt-in*), memiliki mekanisme unsubscribe 1-click (RFC 8058), dan otomatis membersihkan kontak yang bounce/komplain.
4. Permohonan biasanya disetujui dalam waktu 12–24 jam oleh tim kepatuhan AWS.

---

## 📱 Panduan Konfigurasi WhatsApp Business (Meta Cloud API)

ZSender mendukung integrasi resmi **Meta WhatsApp Business Cloud API** dengan skema **Multi-Tenant (Opsi A)**: setiap tenant/klien dapat memakai nomor WhatsApp, WABA ID, dan nama brand mereka masing-masing tanpa campur aduk.

Selain untuk pengiriman pesan massal (*Broadcast Marketing*), ZSender juga dilengkapi antarmuka **Live Chat Inbox Dua Arah** (*Two-Way Messaging*) bergaya WhatsApp Web untuk membalas chat pelanggan secara *real-time*.

### 📋 Prasyarat
1. Akun **Meta for Developers** ([developers.facebook.com](https://developers.facebook.com/)).
2. Akun **Meta Business Suite** (Business Manager terverifikasi untuk produksi).
3. Nomor telepon yang belum terdaftar di aplikasi WhatsApp pribadi/bisnis biasa (nomor bersih untuk dijadikan nomor WhatsApp Business Cloud API).

---

### Langkah 1: Buat Meta App di Portal Pengembang
1. Buka [Meta for Developers](https://developers.facebook.com/) dan login menggunakan akun Facebook Anda.
2. Klik menu **My Apps** ➔ **Create App**.
3. Pilih tipe use-case **Other** ➔ Klik **Next** ➔ Pilih tipe aplikasi **Business**.
4. Isi **App Name** (contoh: `ZSender WhatsApp Service`) dan hubungkan ke **Business Account** perusahaan Anda.
5. Selesaikan pembuatan aplikasi.

---

### Langkah 2: Tambahkan Produk WhatsApp & Dapatkan ID
1. Pada **App Dashboard**, scroll ke bawah pada daftar produk, temukan **WhatsApp**, lalu klik **Set up**.
2. Di sidebar kiri, buka menu **WhatsApp** ➔ **API Setup**.
3. Di halaman ini, Anda akan melihat data:
   - **Phone Number ID**: ID unik nomor telepon pengirim (contoh: `109876543210987`).
   - **WhatsApp Business Account ID (WABA ID)**: ID akun bisnis WhatsApp Anda (contoh: `102938475610293`).
   - Simpan kedua ID ini untuk diisikan ke ZSender.

---

### Langkah 3: Buat Token Akses Permanen (System User Token)
> *Penting: Token sementara di halaman "API Setup" akan kedaluwarsa dalam 24 jam. Untuk sistem produksi atau pengujian jangka panjang, buat Token Permanen melalui System User:*

1. Buka [Meta Business Settings](https://business.facebook.com/settings).
2. Di menu kiri, pilih **Users** ➔ **System Users**.
3. Klik **Add** untuk membuat user baru (Role: **Admin**, misal beri nama `zsender-system-user`).
4. Klik **Assign Assets** pada system user tersebut ➔ Pilih **Apps** ➔ Pilih aplikasi ZSender Anda ➔ Berikan akses penuh (**Full Control / Manage App**).
5. Klik tombol **Generate New Token**:
   - Pilih aplikasi ZSender Anda.
   - Set expiration ke **Never** (Permanen).
   - Beri centang pada 2 izin penting:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
6. Salin token rahasia yang dihasilkan (berawalan `EAAG...`).

---

### Langkah 4: Hubungkan Kredensial di Antarmuka ZSender (Tanpa Sentuh Kode)
1. Buka portal ZSender Tenant di browser: `http://localhost:3650/whatsapp/settings`.
2. Masukkan data yang didapatkan dari langkah sebelumnya:
   - **WhatsApp Business Account ID (WABA ID)**
   - **Phone Number ID** (Wajib)
   - **Display Phone Number** (misal: `+62 812-3456-7890`)
   - **Business Display Name** (misal: `Khair Studio Official`)
   - **Meta Permanent Access Token** (Token `EAAG...` Anda akan otomatis dienkripsi dengan standar **AES-256-GCM** sebelum disimpan ke database).
   - **Webhook Verify Token** (Default: `zsender_wa_verify_token`).
3. Klik tombol **Save Configuration**.
4. Klik tombol **Test Connection**. Jika kredensial benar, status integrasi akan langsung berubah menjadi **CONNECTED** lengkap dengan badge hijau dan nama resmi bisnis Anda dari Meta.

---

### Langkah 5: Konfigurasi Webhook Meta (Pesan Masuk & Live Chat Dua Arah)
Agar pesan balasan dari pelanggan atau status centang pesan (*Sent, Delivered, Read*) dapat masuk secara *real-time* ke ZSender:

1. Kembali ke [Meta for Developers Dashboard](https://developers.facebook.com/) ➔ Buka Aplikasi Anda ➔ **WhatsApp** ➔ **Configuration**.
2. Pada bagian **Webhook**, klik **Edit**:
   - **Callback URL:** Masukkan URL Webhook ZSender Anda:
     - *Mode Produksi (VPS):* `https://api.domainanda.com/api/v1/webhooks/whatsapp`
     - *Mode Lokal:* Gunakan Cloudflare Tunnel atau Ngrok, atau gunakan fitur **Simulator Mandiri** bawaan ZSender jika belum ingin mengekspos port ke publik.
   - **Verify Token:** `zsender_wa_verify_token` (sesuaikan dengan yang tertera di menu *WA Settings* ZSender Anda).
3. Klik **Verify and save**. Meta akan mengirim challenge verifikasi dan ZSender akan langsung merespons dengan kode HTTP 200 OK.
4. Pada bagian **Webhook fields**, klik **Manage**, lalu beri centang / klik **Subscribe** pada event:
   - **`messages`** (Wajib — untuk menerima chat masuk dan status laporan pengiriman).

---

### Langkah 6: Cara Menggunakan Fitur WhatsApp di ZSender

#### 1. Live Chat Inbox Dua Arah (`/whatsapp/chat`)
- Buka menu **WhatsApp ➔ Live Chat**.
- Percakapan pelanggan akan muncul di panel kiri dengan badge jumlah pesan belum dibaca.
- Klik kontak untuk membuka riwayat percakapan.
- Ketik balasan di kotak teks bawah, lalu tekan tombol **Enter** atau klik tombol **Send** untuk membalas langsung ke nomor WhatsApp pelanggan.
- **Uji Coba Cepat (Simulator Bawaan):** Jika Anda belum mendaftarkan nomor fisik WhatsApp ke Meta, klik tombol **"Test Inbound Message"** di pojok kanan atas Live Chat. Masukkan nomor uji coba (misal: `628123456789`) dan isi pesan, pesan simulasi pelanggan akan langsung masuk ke inbox untuk Anda balas!

#### 2. Manajemen Template Pesan (`/whatsapp/templates`)
- Buka menu **WhatsApp ➔ WA Templates**.
- Klik **New Template** untuk mendaftarkan struktur template pesan baru.
- Masukkan nama template (huruf kecil & underscore, misal: `promo_diskon_member`), kategori (`MARKETING`), header teks, dan isi pesan.
- Anda dapat menyisipkan variabel dinamis seperti `{{1}}` untuk nama pelanggan atau `{{2}}` untuk kode voucher.
- Tampilan gelembung pesan WhatsApp interaktif (*Live WhatsApp Bubble Preview*) akan langsung memperlihatkan visual pesan.

#### 3. Kirim Broadcast Kampanye Massal (`/whatsapp/campaigns`)
- Buka menu **WhatsApp ➔ WA Campaigns**.
- **Langkah 1:** Pilih template pesan yang ingin dikirimkan, lalu isi nilai variabel (contoh: isi nilai `{{1}}` dengan "Pelanggan Setia").
- **Langkah 2:** Tentukan target penerima:
  - *All Contacts with Phone:* Otomatis mengirim ke semua kontak di menu Audience yang memiliki atribut nomor telepon.
  - *Custom Phone Numbers:* Tempelkan daftar nomor telepon (dipisahkan koma atau baris baru).
- **Langkah 3:** Cek *Message Preview*, lalu klik tombol **Launch Broadcast Now**.
- Sistem akan mengirimkan pesan satu per satu dan menampilkan tabel ringkasan status pengiriman secara transparan.

---

## 🖥️ Panduan Deployment ke Server VPS (Production)

Berikut adalah panduan lengkap menyiapkan ZSender di server VPS Linux (seperti Biznet GIO, Hetzner, DigitalOcean, Contabo, atau Linode):

### 1. Spesifikasi Minimum Server
- **OS:** Ubuntu 22.04 LTS atau 24.04 LTS (64-bit).
- **Hardware:** Minimal 2 vCPU, 2–4 GB RAM, 25 GB NVMe/SSD Storage.
- **Port Terbuka:** Port `80` (HTTP), `443` (HTTPS), dan Port SSH `22`.

### 2. Instalasi Docker & Docker Compose di VPS
Masuk ke server VPS Anda via SSH, lalu jalankan perintah instalasi Docker resmi:

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Docker Engine otomatis
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Berikan izin ke user saat ini
sudo usermod -aG docker $USER
newgrp docker

# Verifikasi instalasi
docker compose version
```

### 3. Clone Repository ZSender
```bash
git clone https://github.com/3flonet/zsender.git
cd zsender
```

### 4. Konfigurasi Environment Variables Produksi
Buat file konfigurasi `.env` pada folder `deploy/compose/.env`:

```bash
cp deploy/compose/.env.example deploy/compose/.env
nano deploy/compose/.env
```

Sesuaikan nilai-nilai berikut di dalam file `deploy/compose/.env`:

```env
# Mode Pengiriman SES Sungguhan
EMAIL_SES_MODE=aws
AWS_SES_REGION=ap-southeast-1
AWS_SES_ACCESS_KEY=AKIAXXXXXXXXXXXXXXXX
AWS_SES_SECRET_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_SES_FROM_EMAIL=notifikasi@domainanda.com
AWS_SES_FROM_NAME=ZSender
EMAIL_BRAND_NAME=ZSender

# Domain Publik Anda (Ganti dengan domain asli Anda)
EMAIL_APP_URL=https://app.domainanda.com
OPERATOR_APP_URL=https://console.domainanda.com
APP_PUBLIC_URL=https://api.domainanda.com

# Kunci Rahasia Unik (Generate dengan: openssl rand -hex 32)
EMAIL_JWT_SECRET=generate_rahasia_acak_minimal_32_karakter
EMAIL_UNSUBSCRIBE_SIGNING_SECRET=generate_rahasia_acak_minimal_32_karakter
EMAIL_TRACKING_SIGNING_SECRET=generate_rahasia_acak_minimal_32_karakter
EMAIL_DEMO_PASSWORD=PasswordAdminRahasiaAnda123!
```

### 5. Jalankan Container ZSender
Jalankan ZSender dalam mode *background daemon*:

```bash
docker compose --env-file deploy/compose/.env -f deploy/compose/compose.yaml up -d --build
```

Setelah container aktif, inisialisasi data database pertama kali:

```bash
docker compose --env-file deploy/compose/.env -f deploy/compose/compose.yaml exec api node dist-scripts/scripts/seed.js --force
```

### 6. Konfigurasi Nginx Reverse Proxy & SSL HTTPS Gratis (Certbot)
Agar ZSender dapat diakses menggunakan domain dengan protokol HTTPS yang aman:

1. **Arahkan DNS Record Domain Anda ke IP Publik VPS:**
   - `app.domainanda.com` ➔ Record `A` ke `IP_VPS_ANDA`
   - `console.domainanda.com` ➔ Record `A` ke `IP_VPS_ANDA`
   - `api.domainanda.com` ➔ Record `A` ke `IP_VPS_ANDA`

2. **Install Nginx & Certbot di VPS:**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```

3. **Buat File Konfigurasi Nginx (`/etc/nginx/sites-available/zsender.conf`):**
   ```nginx
   # 1. Tenant Portal App (Port 3650)
   server {
       server_name app.domainanda.com;
       location / {
           proxy_pass http://127.0.0.1:3650;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }

   # 2. Operator Console (Port 3660)
   server {
       server_name console.domainanda.com;
       location / {
           proxy_pass http://127.0.0.1:3660;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }

   # 3. Backend API (Port 5126)
   server {
       server_name api.domainanda.com;
       location / {
           proxy_pass http://127.0.0.1:5126;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           client_max_body_size 25M;
       }
   }
   ```

4. **Aktifkan Konfigurasi & Dapatkan SSL Gratis:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/zsender.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d app.domainanda.com -d console.domainanda.com -d api.domainanda.com
   ```

Selamat! ZSender sekarang sudah berjalan penuh secara mandiri di server VPS Anda dengan sertifikat SSL HTTPS resmi.

---

## 🔑 Akun & Kredensial Bawaan

Semua akun default menggunakan password: **`Demo-Password123!`**

1. **Masuk ke Operator Console (`http://localhost:3660`)**:
   - **Email:** `admin@khairstudio.com`
   - **Password:** `Demo-Password123!`
   - **Peran:** `SUPERADMIN`

2. **Masuk ke Tenant Portal (`http://localhost:3650`)**:
   - **Email:** `admin@khairstudio.com`
   - **Password:** `Demo-Password123!`
   - **Workspace:** `Khair Studio` (Paket Enterprise)

---

## 📂 Struktur Folder Proyek

```text
zsender/
├── apps/
│   ├── api/             # Backend Express 5, worker pengiriman, SES consumer, routing, dan database
│   ├── web/             # Single-Page App React 19 untuk tenant/pengguna ZSender
│   └── console/         # Single-Page App React 19 untuk operator platform ZSender
├── packages/
│   └── types/           # Wire contract DTO (@open-email/types) untuk sinkronisasi tipe data
├── db/
│   ├── migrations/      # File migrasi SQL murni (0001_init.sql)
│   └── migrate.ts       # Runner migrasi SQL otomatis
├── deploy/
│   └── compose/         # File konfigurasi Docker Compose untuk lokal dan cloud
├── infra/
│   ├── docker/          # Dockerfile untuk API, Web, dan Console
│   └── terraform/       # Modul Terraform untuk deployment skala produksi di AWS
└── docs/                # Dokumentasi arsitektur, panduan konfigurasi, dan security model
```

---

## ⚙️ Konfigurasi Lingkungan (Environment Variables)

File konfigurasi utama terletak pada `.env` (contoh pada `apps/api/.env.example` dan `deploy/compose/.env.example`).

Berikut adalah variabel-variabel kunci:

```env
# Identitas Brand
BRAND_NAME=ZSender
AWS_SES_FROM_NAME=ZSender

# Rahasia Kunci (Gunakan 32+ karakter acak di produksi)
JWT_SECRET=rahasia_jwt_acak_panjang_minimal_32_karakter
EMAIL_UNSUBSCRIBE_SIGNING_SECRET=rahasia_signing_unsubscribe_32_karakter
EMAIL_TRACKING_SIGNING_SECRET=rahasia_signing_tracking_32_karakter

# Port & URL
PORT=5126
EMAIL_APP_URL=http://localhost:3650
OPERATOR_APP_URL=http://localhost:3660
APP_PUBLIC_URL=http://localhost:5126

# Database & Redis
DATABASE_URL=postgres://mail:mail@localhost:5572/mail
REDIS_URL=redis://localhost:6509/0

# Kredensial Amazon SES (Kosongkan jika menggunakan mode simulasi lokal)
EMAIL_SES_MODE=aws
AWS_SES_REGION=ap-southeast-1
AWS_SES_ACCESS_KEY=AKIAXXXXXXXXXXXXXXXX
AWS_SES_SECRET_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_SES_FROM_EMAIL=notifikasi@domainanda.com
```

---

## 👨‍💻 Pengembang & Lisensi

- **Dikembangkan & Dimodifikasi oleh:** [Khair Studio](https://github.com/3flonet)
- **Lisensi:** Dirilis di bawah lisensi terbuka [MIT License](LICENSE). Anda bebas menggunakan, memodifikasi, dan menerapkan proyek ini untuk kebutuhan pribadi maupun komersial tanpa royalti software.

---

<p align="center">
  Dibuat dengan ❤️ oleh <b>Khair Studio</b> untuk kebebasan infrastruktur email digital.
</p>

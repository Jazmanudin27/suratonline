# Surat Ajuan Online - PT NUSA MANDIRI ABADI

Aplikasi web sistem persetujuan surat resmi multi-cabang berbasis **React (Vite) + Tailwind CSS**.

---

## 1. Ringkasan Alur Kerja

```
[Pemohon Cabang]
  │
  ├─► 1. Pilih Template Surat (PERDIN, SERVICE, dll)
  ├─► 2. Isi Form Khusus (Data cabang & karyawan terisi otomatis)
  ├─► 3. Sistem menyusun surat otomatis
  ├─► 4. Edit bebas di Editor Word (bold, font, tabel, foto)
  └─► 5. Simpan Draf / Kirim ke Approver
         │
         ▼
[Jalur Persetujuan Bertingkat]
  │
  ├─► Tahap 1: Kepala Cabang (Setujui / Tolak / Kembalikan Revisi)
  ├─► Tahap 2: Manajer Area
  └─► Tahap 3: Pimpinan Pusat (Direksi)
         │
         ▼
[Dokumen Disetujui Penuh]
  │
  ├─► Lembar Pengesahan Digital Terverifikasi
  ├─► Jejak Audit (Audit Trail) Lengkap
  └─► Ekspor / Unduh PDF format A4 Resmi
```

---

## 2. Struktur Database Relasional

Jika diimplementasikan pada database PostgreSQL / Supabase:

1. **`branches`**: `id`, `code`, `name`, `address`, `created_at`
2. **`roles`**: `id`, `name` (`admin_pusat`, `approver`, `pemohon`), `description`
3. **`users`**: `id`, `name`, `email`, `role_id`, `branch_id`, `position`, `created_at`
4. **`templates`**: `id`, `code`, `name`, `category`, `description`, `number_format`, `letter_template`, `is_active`
5. **`template_fields`**: `id`, `template_id`, `label`, `name`, `type`, `required`, `options`, `sort_order`
6. **`template_approval_steps`**: `id`, `template_id`, `step`, `title`, `approver_role`
7. **`letters`**: `id`, `template_id`, `letter_number`, `user_id`, `branch_id`, `status`, `current_step`, `total_steps`, `title`, `field_values`, `content`, `created_at`, `updated_at`
8. **`approvals`**: `id`, `letter_id`, `step`, `approver_id`, `approver_role`, `status`, `notes`, `action_date`
9. **`notifications`**: `id`, `user_id`, `title`, `message`, `letter_id`, `is_read`, `created_at`
10. **`audit_logs`**: `id`, `letter_id`, `user_name`, `action`, `notes`, `timestamp`

---

## 3. Struktur Folder React

```
SuratAjuan/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx                # Header, notifikasi, demo switcher peran
│   │   ├── Dashboard.jsx             # Statistik KPI, chart cabang/template
│   │   ├── TemplateCatalog.jsx       # Katalog pilihan jenis surat
│   │   ├── LetterFormBuilder.jsx     # Wizard isian form -> editor Word -> pratinjau
│   │   ├── RichEditor.jsx            # Word-like Rich Text Editor (formatting, tabel, gambar)
│   │   ├── LetterDocumentView.jsx    # Format surat resmi, kop perusahaan, tanda tangan digital & PDF
│   │   ├── ApproverInbox.jsx         # Kotak masuk approver (setujui, tolak, revisi)
│   │   ├── AdminTemplateManager.jsx  # Form builder & template studio admin
│   │   └── LetterList.jsx            # Daftar arsip surat dengan filter
│   ├── data/
│   │   └── mockData.js               # Data awal: Cabang, User, Template PERDIN & SERVICE
│   ├── services/
│   │   └── storage.js                # State engine, nomor otomatis, generator variabel, audit trail
│   ├── App.jsx                       # Routing & navigasi aplikasi
│   ├── main.jsx                      # Entry point React
│   └── index.css                     # Tailwind CSS v4 styling
├── package.json
└── vite.config.js
```

---

## 4. Cara Menjalankan Aplikasi (Untuk Pemula)

1. Buka folder proyek di Terminal / Command Prompt:
   ```bash
   cd G:\SuratAjuan
   ```
2. Jalankan server lokal:
   ```bash
   npm run dev
   ```
3. Buka browser dan akses alamat:
   ```
   http://localhost:5173
   ```
4. **Fitur Pengujian Cepat (User Switcher)**:
   - Klik nama pengguna di pojok kanan atas navbar untuk berganti peran seketika:
     - **Budi Pratama** (Pemohon Cabang Jakarta)
     - **Hendra Wijaya, S.E.** (Approver 1 - Kepala Cabang)
     - **Ratna Kusuma, M.M.** (Approver 2 - Manajer Area)
     - **Drs. Bambang Sudarmono** (Approver 3 - Direktur Operasional)
     - **Super Admin Pusat** (Kelola Template & Form Builder)

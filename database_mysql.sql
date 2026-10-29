-- ========================================================
-- SKEMA DATABASE MYSQL UNTUK DATABASE: portal
-- Kompatibel dengan Navicat & MySQL 5.7 / 8.0+ / MariaDB
-- ========================================================

USE portal;

-- 1. TABEL CABANG (Jika belum ada, dibuat otomatis)
CREATE TABLE IF NOT EXISTS `branches` (
  `id` VARCHAR(50) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `address` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PENYESUAIAN TABEL USERS (Jika tabel users sudah ada dari sistem marketplace/portal)
-- Script ini memeriksa dan menambahkan kolom surat ajuan jika belum ada:
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tambah kolom integrasi Surat Ajuan ke tabel users jika belum ada
SET @dbname = DATABASE();
SET @tablename = "users";

-- role
SET @columnname = "role";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'pemohon'"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- role_label
SET @columnname = "role_label";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN role_label VARCHAR(100) NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- branch_id
SET @columnname = "branch_id";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN branch_id VARCHAR(50) NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- branch_name
SET @columnname = "branch_name";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN branch_name VARCHAR(150) NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- position (jabatan)
SET @columnname = "position";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN position VARCHAR(150) NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- approval_level
SET @columnname = "approval_level";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN approval_level INT DEFAULT 1"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;


-- 3. TABEL TEMPLATE SURAT DINAMIS
CREATE TABLE IF NOT EXISTS `templates` (
  `id` VARCHAR(50) NOT NULL,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) DEFAULT 'Umum',
  `description` TEXT NULL,
  `number_format` VARCHAR(200) NOT NULL,
  `allowed_branches` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `approval_steps` JSON NOT NULL,
  `fields` JSON NOT NULL,
  `letter_template` LONGTEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3b. TABEL KATEGORI TEMPLATE
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `categories` (`name`) VALUES
('Umum'),
('Operasional'),
('Kepegawaian / HRD'),
('Marketing'),
('Sales & CRM'),
('Keuangan & Anggaran'),
('Logistik & Distribusi'),
('Legal & Perizinan');


-- 4. TABEL SURAT AJUAN RESMI (LETTERS)
CREATE TABLE IF NOT EXISTS `letters` (
  `id` VARCHAR(50) NOT NULL,
  `template_id` VARCHAR(50) NOT NULL,
  `template_code` VARCHAR(30) NOT NULL,
  `template_name` VARCHAR(150) NOT NULL,
  `letter_number` VARCHAR(100) NOT NULL UNIQUE,
  `user_id` VARCHAR(50) NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `branch_id` VARCHAR(50) NULL,
  `branch_name` VARCHAR(150) NOT NULL,
  `status` ENUM('draft', 'pending', 'approved', 'rejected', 'revision') DEFAULT 'draft',
  `current_step` INT DEFAULT 1,
  `total_steps` INT DEFAULT 1,
  `title` VARCHAR(255) NOT NULL,
  `field_values` JSON NULL,
  `content` LONGTEXT NULL,
  `approval_history` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_branch` (`branch_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5. TABEL NOTIFIKASI
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `letter_id` VARCHAR(50) NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_notif` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 6. TABEL AUDIT LOG (JEJAK RIWAYAT SURAT)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(50) NOT NULL,
  `letter_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `notes` TEXT NULL,
  `timestamp` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_letter_audit` (`letter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ========================================================
-- DATA AWAL BAWAAN (HANYA MENGISI JIKA DATA MASIH KOSONG)
-- ========================================================

-- Isi Data Cabang Bawaan (jika belum ada)
INSERT IGNORE INTO `branches` (`id`, `code`, `name`, `address`) VALUES
('CBG-JKT', 'CBG-JKT', 'Cabang Jakarta Pusat', 'Jl. Sudirman No. 45, Jakarta Pusat'),
('CBG-SBY', 'CBG-SBY', 'Cabang Surabaya', 'Jl. Pemuda No. 88, Surabaya'),
('CBG-BDG', 'CBG-BDG', 'Cabang Bandung', 'Jl. Asia Afrika No. 12, Bandung'),
('CBG-MDN', 'CBG-MDN', 'Cabang Medan', 'Jl. Gatot Subroto No. 20, Medan');

-- Isi Data Template PERDIN, SERVICE, DISKON, CUTI (jika belum ada)
INSERT IGNORE INTO `templates` (`id`, `code`, `name`, `category`, `description`, `number_format`, `allowed_branches`, `is_active`, `approval_steps`, `fields`, `letter_template`) VALUES
('tpl-perdin', 'PERDIN', 'Ajuan Perjalanan Dinas', 'Operasional', 'Surat tugas dan pengajuan estimasi biaya perjalanan dinas luar kota karyawan cabang.', '{{seq}}/PERDIN/{{branch_code}}/{{roman_month}}/{{year}}', '["all"]', 1, 
'[{"step": 1, "title": "Persetujuan Kepala Cabang", "approverRole": "Kepala Cabang"}, {"step": 2, "title": "Persetujuan Manajer Area", "approverRole": "Manajer Area"}, {"step": 3, "title": "Persetujuan Pimpinan Pusat", "approverRole": "Pimpinan Pusat"}]',
'[{"id": "f_nama", "name": "nama_pemohon", "type": "text", "label": "Nama Pemohon", "required": true}, {"id": "f_tujuan", "name": "kota_tujuan", "type": "text", "label": "Kota Tujuan", "required": true}, {"id": "f_biaya", "name": "rincian_biaya", "type": "table_costs", "label": "Rincian Biaya", "required": true}]',
'<p>{{nama_cabang}}, {{tanggal_surat}}</p><p>Nomor: {{nomor_surat}}</p><p>Perihal: Permohonan Perjalanan Dinas</p><p>Nama: {{nama_pemohon}}</p><p>Tujuan: {{kota_tujuan}}</p>{{tabel_biaya_html}}'),

('tpl-service', 'SERVICE', 'Ajuan Service / Perbaikan Aset', 'Pemeliharaan', 'Surat perbaikan aset dan kendaraan operasional cabang.', '{{seq}}/SERVICE/{{branch_code}}/{{roman_month}}/{{year}}', '["all"]', 1,
'[{"step": 1, "title": "Persetujuan Kepala Cabang", "approverRole": "Kepala Cabang"}, {"step": 2, "title": "Persetujuan Manajer Area", "approverRole": "Manajer Area"}]',
'[{"id": "f_nama", "name": "nama_pemohon", "type": "text", "label": "Nama Pemohon", "required": true}, {"id": "f_aset", "name": "nama_nomor_aset", "type": "text", "label": "Nama / Plat No Aset", "required": true}, {"id": "f_biaya", "name": "estimasi_biaya", "type": "number", "label": "Estimasi Biaya", "required": true}]',
'<p>{{nama_cabang}}, {{tanggal_surat}}</p><p>Nomor: {{nomor_surat}}</p><p>Perihal: Pengajuan Service Aset</p><p>Aset: {{nama_nomor_aset}}</p><p>Estimasi Biaya: Rp {{estimasi_biaya_format}}</p>'),

('tpl-diskon-crm', 'DISKON', 'Ajuan Diskon Khusus Klien (CRM)', 'Sales & CRM', 'Surat persetujuan potongan harga khusus atau negosiasi kontrak proyek klien perusahaan.', '{{seq}}/DISKON/{{branch_code}}/{{roman_month}}/{{year}}', '["all"]', 1,
'[{"step": 1, "title": "Persetujuan Kepala Cabang", "approverRole": "Kepala Cabang"}, {"step": 2, "title": "Persetujuan Manajer Area", "approverRole": "Manajer Area"}, {"step": 3, "title": "Persetujuan Pimpinan Pusat (Direksi)", "approverRole": "Pimpinan Pusat"}]',
'[{"id": "f_nama", "name": "nama_pemohon", "type": "text", "label": "Nama Sales", "required": true}, {"id": "f_klien", "name": "nama_klien", "type": "text", "label": "Nama Perusahaan Klien", "required": true}, {"id": "f_nilai", "name": "nilai_kontrak", "type": "number", "label": "Nilai Kontrak (Rp)", "required": true}, {"id": "f_diskon", "name": "persen_diskon", "type": "number", "label": "Diskon (%)", "required": true}]',
'<p>{{nama_cabang}}, {{tanggal_surat}}</p><p>Nomor: {{nomor_surat}}</p><p>Perihal: Permohonan Diskon Khusus Klien</p><p>Klien: {{nama_klien}}</p><p>Nilai: Rp {{nilai_kontrak_format}}</p><p>Diskon: {{persen_diskon}}%</p>');

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import fsPromises from "fs/promises";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure directories exist for public/lampiran
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
ensureDir(path.join(__dirname, "public/lampiran/gambar"));
ensureDir(path.join(__dirname, "public/lampiran/pdf"));
ensureDir(path.join(__dirname, "public/lampiran/dokumen"));

// Static file serving for uploads & public assets
app.use("/lampiran", express.static(path.join(__dirname, "public/lampiran")));
app.use(
  "/api/lampiran",
  express.static(path.join(__dirname, "public/lampiran")),
);
app.use("/public", express.static(path.join(__dirname, "public")));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "31.97.109.165",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "portal",
  password: process.env.DB_PASSWORD || "Jazman@271998",
  database: process.env.DB_NAME || "portal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000,
  ssl: false,
});

// Test connection on boot and ensure comments, attachments, default_viewers, and system_settings exist
pool
  .getConnection()
  .then(async (conn) => {
    console.log(" [MySQL] Connected successfully to database: portal");
    try {
      await conn.query(`ALTER TABLE letters ADD COLUMN comments JSON NULL`);
      console.log(" [MySQL] Checked/added comments column to letters table");
    } catch (e) {
      // Column may already exist
    }
    try {
      await conn.query(`ALTER TABLE letters ADD COLUMN attachments JSON NULL`);
      console.log(" [MySQL] Checked/added attachments column to letters table");
    } catch (e) {
      // Column may already exist
    }
    try {
      await conn.query(
        `UPDATE letters SET attachments = field_values->'$.attachments' WHERE (attachments IS NULL OR JSON_LENGTH(attachments) = 0) AND field_values->'$.attachments' IS NOT NULL`,
      );
      console.log(
        " [MySQL] Synced existing field_values attachments to attachments column",
      );
    } catch (e) {
      // Ignore if JSON functions differ
    }
    try {
      await conn.query(
        `ALTER TABLE templates ADD COLUMN default_viewers JSON NULL`,
      );
      console.log(
        " [MySQL] Checked/added default_viewers column to templates table",
      );
    } catch (e) {
      // Column may already exist
    }
    try {
      await conn.query(
        `ALTER TABLE templates ADD COLUMN has_nominal_limit TINYINT(1) DEFAULT 0`,
      );
      await conn.query(
        `ALTER TABLE templates ADD COLUMN nominal_field VARCHAR(100) NULL`,
      );
      console.log(
        " [MySQL] Checked/added has_nominal_limit and nominal_field columns to templates table",
      );
    } catch (e) {
      // Column may already exist
    }
    try {
      await conn.query(`ALTER TABLE letters ADD COLUMN shared_with JSON NULL`);
      console.log(" [MySQL] Checked/added shared_with column to letters table");
    } catch (e) {
      // Column may already exist
    }
    try {
      await conn.query(
        `UPDATE letters SET title = UPPER(title) WHERE title IS NOT NULL`,
      );
      console.log(" [MySQL] Ensured all letter titles are UPPERCASE");
    } catch (e) {
      // Ignore if table letters doesn't exist yet
    }
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          key_name VARCHAR(100) NOT NULL PRIMARY KEY,
          value_data LONGTEXT NULL,
          updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log(" [MySQL] Checked/created system_settings table");
    } catch (e) {
      console.warn(" [MySQL] Table system_settings warning:", e.message);
    }
    try {
      await conn.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL`);
      console.log(" [MySQL] Checked/added phone column to users table");
    } catch (e) {
      // Column may already exist
    }

    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log(" [MySQL] Checked/created categories table");
    } catch (e) {
      console.warn(" [MySQL] Table categories warning:", e.message);
    }
    conn.release();
  })
  .catch((err) => {
    console.error(" [MySQL] Connection failed:", err.message);
  });

// In-memory cache helper for master data to speed up API responses and prevent remote DB bottleneck
const cacheStore = new Map();
const getCachedOrFetch = async (key, ttlMs, fetchFn) => {
  const now = Date.now();
  const cached = cacheStore.get(key);
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }
  const fresh = await fetchFn();
  cacheStore.set(key, { data: fresh, timestamp: now });
  return fresh;
};

// -------------------------------------------------------------
// 1. MASTER CABANG
// -------------------------------------------------------------
app.get("/api/cabang", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT kode_cabang AS id, kode_cabang AS code, nama_cabang AS name,
              alamat_cabang AS address, telepon_cabang AS phone,
              nama_pt AS pt, kode_pt, status_aktif_cabang, email, urutan
       FROM cabang
       WHERE status_aktif_cabang = '1'
       ORDER BY urutan ASC, kode_cabang ASC`,
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
});

app.put("/api/cabang/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, pt, email } = req.body;
    await pool.query(
      `UPDATE cabang 
       SET nama_cabang = COALESCE(?, nama_cabang),
           alamat_cabang = COALESCE(?, alamat_cabang),
           telepon_cabang = COALESCE(?, telepon_cabang),
           nama_pt = COALESCE(?, nama_pt),
           email = COALESCE(?, email)
       WHERE kode_cabang = ?`,
      [name, address, phone, pt, email, id],
    );
    cacheStore.delete("cabang");
    res.json({ success: true, message: "Data cabang berhasil disimpan ke database" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/cabang", async (req, res) => {
  try {
    const { code, name, address, phone, pt, email } = req.body;
    const cleanCode = (code || "").toUpperCase().trim();
    if (!cleanCode || !name) {
      return res.status(400).json({ success: false, message: "Kode dan Nama Cabang wajib diisi" });
    }
    await pool.query(
      `INSERT INTO cabang (kode_cabang, nama_cabang, alamat_cabang, telepon_cabang, nama_pt, email, status_aktif_cabang)
       VALUES (?, ?, ?, ?, ?, ?, '1')
       ON DUPLICATE KEY UPDATE
         nama_cabang = VALUES(nama_cabang),
         alamat_cabang = VALUES(alamat_cabang),
         telepon_cabang = VALUES(telepon_cabang),
         nama_pt = VALUES(nama_pt),
         email = VALUES(email)`,
      [cleanCode, name, address || "", phone || "", pt || "", email || ""],
    );
    cacheStore.delete("cabang");
    res.json({ success: true, message: "Cabang baru berhasil disimpan ke database" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 2. MASTER HRD JABATAN
// -------------------------------------------------------------
app.get("/api/jabatan", async (req, res) => {
  try {
    const rows = await getCachedOrFetch("jabatan", 60000, async () => {
      const [r] = await pool.query(
        `SELECT kode_jabatan AS kode, nama_jabatan AS nama, alias, kategori
         FROM hrd_jabatan
         ORDER BY kode_jabatan ASC`,
      );
      return r;
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 2b. MASTER PRODUK
// -------------------------------------------------------------
app.get("/api/produk", async (req, res) => {
  try {
    const data = await getCachedOrFetch("produk", 60000, async () => {
      const [products] = await pool.query(
        `SELECT * FROM produk ORDER BY urutan ASC, kode_produk ASC`,
      );

      const [prices] = await pool.query(
        `SELECT 
          ph.*,
          c.nama_cabang
        FROM produk_harga ph
        LEFT JOIN cabang c ON ph.kode_cabang = c.kode_cabang
        WHERE (ph.status_aktif_harga = 1 OR ph.status_aktif_harga = '1')
          AND (ph.kode_pelanggan IS NULL OR ph.kode_pelanggan = '')
        ORDER BY ph.kode_cabang ASC, ph.kode_kategori_salesman ASC`,
      );

      // Petakan harga ke masing-masing produk
      const priceMap = {};
      prices.forEach((p) => {
        if (!priceMap[p.kode_produk]) {
          priceMap[p.kode_produk] = [];
        }
        priceMap[p.kode_produk].push(p);
      });

      return products.map((prod) => ({
        ...prod,
        daftar_harga: priceMap[prod.kode_produk] || [],
      }));
    });

    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message, data: [] });
  }
});

// -------------------------------------------------------------
// 2c. INTERNAL MEMO (KHUSUS MOBILE)
// -------------------------------------------------------------
app.get("/api/internal_memo", async (req, res) => {
  try {
    const rawUserId = req.query.userId || req.headers["x-user-id"] || null;
    const userId = Number(rawUserId) || 0;

    // 1. Ambil data internal memo aktif
    const [rows] = await pool.query(
      `SELECT * FROM internal_memo 
       WHERE status = 'aktif' OR status IS NULL OR status = ''
       ORDER BY tanggal_im DESC, id DESC`,
    );

    // 2. Ambil ack user saat ini jika ada
    let ackMap = {};
    let readMap = {};
    if (userId > 0) {
      try {
        const [acks] = await pool.query(
          `SELECT internal_memo_id, status, updated_at FROM internal_memo_ack WHERE user_id = ?`,
          [userId],
        );
        acks.forEach((a) => {
          ackMap[a.internal_memo_id] = a;
        });
      } catch (e) {
        console.warn("ack query warn:", e.message);
      }

      try {
        const [reads] = await pool.query(
          `SELECT internal_memo_id, dibaca_pada FROM internal_memo_log_baca WHERE user_id = ?`,
          [userId],
        );
        reads.forEach((r) => {
          readMap[r.internal_memo_id] = r.dibaca_pada;
        });
      } catch (e) {
        console.warn("read query warn:", e.message);
      }
    }

    // 3. Ambil tujuan cabang
    let branchMap = {};
    try {
      const [branchesRows] = await pool.query(
        `SELECT imtc.internal_memo_id, imtc.kode_cabang, c.nama_cabang
         FROM internal_memo_tujuan_cabang imtc
         LEFT JOIN cabang c ON imtc.kode_cabang = c.kode_cabang`,
      );
      branchesRows.forEach((b) => {
        if (!branchMap[b.internal_memo_id]) {
          branchMap[b.internal_memo_id] = [];
        }
        branchMap[b.internal_memo_id].push({
          kode_cabang: b.kode_cabang,
          nama_cabang: b.nama_cabang || b.kode_cabang,
        });
      });
    } catch (e) {
      console.warn("branch query warn:", e.message);
    }

    const data = rows.map((im) => ({
      ...im,
      ack_status: ackMap[im.id]?.status || null,
      ack_at: ackMap[im.id]?.updated_at || null,
      read_at: readMap[im.id] || null,
      tujuan_cabang: branchMap[im.id] || [],
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("API /api/internal_memo error:", err.message);
    res.json({ success: false, message: err.message, data: [] });
  }
});

// Proxy fetch berkas PDF Internal Memo dari server app.portalmp.com (mengatasi CORS & same-origin)
app.get("/api/internal_memo/pdf/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const remoteUrl = `https://app.portalmp.com/storage/internal_memo/${encodeURIComponent(filename)}`;

    const response = await fetch(remoteUrl);
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "Berkas PDF tidak ditemukan di server pusat",
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("Proxy PDF IM Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Catat log baca memo
app.post("/api/internal_memo/:id/read", async (req, res) => {
  try {
    const memoId = req.params.id;
    const { userId } = req.body;
    if (memoId && userId) {
      await pool.query(
        `INSERT INTO internal_memo_log_baca (internal_memo_id, user_id, dibaca_pada)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE dibaca_pada = NOW()`,
        [memoId, userId],
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Konfirmasi Paham Memo (Ack)
app.post("/api/internal_memo/:id/ack", async (req, res) => {
  try {
    const memoId = req.params.id;
    const { userId, status = "paham" } = req.body;
    if (!memoId || !userId) {
      return res
        .status(400)
        .json({ success: false, message: "ID memo dan user wajib diisi" });
    }

    await pool.query(
      `INSERT INTO internal_memo_ack (internal_memo_id, user_id, status, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()`,
      [memoId, userId, status],
    );

    res.json({ success: true, message: "Status konfirmasi berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 3. AUTHENTICATION & MASTER USERS
// -------------------------------------------------------------
import bcrypt from "bcryptjs";

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username / Email dan password wajib diisi",
      });
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.username, u.email, u.password, u.kode_cabang AS branchId,
              c.nama_cabang AS branchName, c.nama_pt AS pt,
              u.kode_jabatan AS kodeJabatan, j.nama_jabatan AS position,
              u.status,
              CASE
                WHEN u.kode_jabatan IN ('J01', 'J02', 'J03', 'J04', 'J05', 'J06', 'J07', 'J08') THEN 'approver'
                WHEN u.kode_jabatan IN ('J26', 'J27') THEN 'admin_pusat'
                ELSE 'pemohon'
              END AS role,
              CASE
                WHEN u.kode_jabatan = 'J01' THEN 'Direktur Utama (Approver 3)'
                WHEN u.kode_jabatan = 'J03' THEN 'Regional Sales Manager (Approver 2)'
                WHEN u.kode_jabatan IN ('J07', 'J08') THEN 'Manager Cabang (Approver 1)'
                WHEN u.kode_jabatan = 'J26' THEN 'Admin (CRM Pusat)'
                WHEN u.kode_jabatan = 'J27' THEN 'Super Admin (IT Pusat)'
                ELSE 'Pemohon Cabang'
              END AS roleLabel
       FROM users u
       LEFT JOIN cabang c ON u.kode_cabang = c.kode_cabang
       LEFT JOIN hrd_jabatan j ON u.kode_jabatan = j.kode_jabatan
       WHERE (u.username = ? OR u.email = ?) AND u.status = '1'
       LIMIT 1`,
      [username.trim(), username.trim()],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username atau email tidak terdaftar atau akun non-aktif.",
      });
    }

    const user = rows[0];
    const dbHash = user.password;

    // Verify bcrypt hash or fallback to direct/master login
    let isValid = false;
    try {
      if (
        dbHash &&
        (dbHash.startsWith("$2y$") ||
          dbHash.startsWith("$2a$") ||
          dbHash.startsWith("$2b$"))
      ) {
        // Standardize $2y$ to $2a$ for bcryptjs compatibility
        const standardHash = dbHash.replace(/^\$2y\$/, "$2a$");
        isValid = await bcrypt.compare(password, standardHash);
      }
    } catch (e) {
      console.warn("Bcrypt compare error:", e.message);
    }

    // Plain text password comparison if not hashed with bcrypt in database
    if (!isValid && dbHash && password === dbHash) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Password salah. Silakan coba kembali.",
      });
    }

    // Clean user response
    delete user.password;
    res.json({
      success: true,
      message: "Login berhasil!",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const rows = await getCachedOrFetch("users", 30000, async () => {
      const [r] = await pool.query(
        `SELECT u.id, u.name, u.username, u.email, u.kode_cabang AS branchId,
                c.nama_cabang AS branchName, c.nama_pt AS pt,
                u.kode_jabatan AS kodeJabatan, j.nama_jabatan AS position,
                u.status,
                CASE
                  WHEN u.kode_jabatan IN ('J01', 'J02', 'J03', 'J04', 'J05', 'J06', 'J07', 'J08') THEN 'approver'
                  WHEN u.kode_jabatan IN ('J26', 'J27') THEN 'admin_pusat'
                  ELSE 'pemohon'
                END AS role,
                CASE
                  WHEN u.kode_jabatan = 'J01' THEN 'Direktur Utama (Approver 3)'
                  WHEN u.kode_jabatan = 'J03' THEN 'Regional Sales Manager (Approver 2)'
                  WHEN u.kode_jabatan IN ('J07', 'J08') THEN 'Manager Cabang (Approver 1)'
                  WHEN u.kode_jabatan = 'J26' THEN 'Admin (CRM Pusat)'
                  WHEN u.kode_jabatan = 'J27' THEN 'Super Admin (IT Pusat)'
                  ELSE 'Pemohon Cabang'
                END AS roleLabel
         FROM users u
         LEFT JOIN cabang c ON u.kode_cabang = c.kode_cabang
         LEFT JOIN hrd_jabatan j ON u.kode_jabatan = j.kode_jabatan
         WHERE u.status = '1'
         ORDER BY u.id ASC`,
      );
      return r;
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 4. TEMPLATES (MANAJEMEN TEMPLATE SURAT)
// -------------------------------------------------------------
app.get("/api/templates", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM templates ORDER BY created_at DESC`,
    );
    const formatted = rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      category: r.category,
      description: r.description,
      numberFormat: r.number_format,
      allowedBranches:
        typeof r.allowed_branches === "string"
          ? JSON.parse(r.allowed_branches)
          : r.allowed_branches,
      isActive: Boolean(r.is_active),
      approvalSteps:
        typeof r.approval_steps === "string"
          ? JSON.parse(r.approval_steps)
          : r.approval_steps,
      fields: typeof r.fields === "string" ? JSON.parse(r.fields) : r.fields,
      letterTemplate: r.letter_template,
      defaultViewers: r.default_viewers
        ? typeof r.default_viewers === "string"
          ? JSON.parse(r.default_viewers)
          : r.default_viewers
        : [],
      hasNominalLimit: Boolean(
        r.has_nominal_limit !== undefined && r.has_nominal_limit !== null
          ? r.has_nominal_limit
          : Array.isArray(typeof r.approval_steps === "string" ? JSON.parse(r.approval_steps) : r.approval_steps) &&
            (typeof r.approval_steps === "string" ? JSON.parse(r.approval_steps) : r.approval_steps).some((s) => s.maxAmount > 0),
      ),
      nominalField: r.nominal_field || "total_biaya",
      createdAt: r.created_at,
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/templates", async (req, res) => {
  try {
    const t = req.body;
    const id = t.id || `tpl-${Date.now().toString(36)}`;
    const allowed = JSON.stringify(t.allowedBranches || ["all"]);
    const steps = JSON.stringify(t.approvalSteps || []);
    const fields = JSON.stringify(t.fields || []);
    const defaultViewers = JSON.stringify(t.defaultViewers || []);
    const hasNominalLimit = t.hasNominalLimit ? 1 : 0;
    const nominalField = t.nominalField || "total_biaya";

    try {
      await pool.query(
        `INSERT INTO templates (id, code, name, category, description, number_format, allowed_branches, is_active, approval_steps, fields, letter_template, default_viewers, has_nominal_limit, nominal_field)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           code = VALUES(code),
           name = VALUES(name),
           category = VALUES(category),
           description = VALUES(description),
           number_format = VALUES(number_format),
           allowed_branches = VALUES(allowed_branches),
           is_active = VALUES(is_active),
           approval_steps = VALUES(approval_steps),
           fields = VALUES(fields),
           letter_template = VALUES(letter_template),
           default_viewers = VALUES(default_viewers),
           has_nominal_limit = VALUES(has_nominal_limit),
           nominal_field = VALUES(nominal_field)`,
        [
          id,
          t.code,
          t.name,
          t.category || "Umum",
          t.description || "",
          t.numberFormat,
          allowed,
          t.isActive !== false ? 1 : 0,
          steps,
          fields,
          t.letterTemplate || "",
          defaultViewers,
          hasNominalLimit,
          nominalField,
        ],
      );
    } catch (insertColErr) {
      console.warn(" [MySQL] saveTemplate fallback 1:", insertColErr.message);
      try {
        await pool.query(
          `INSERT INTO templates (id, code, name, category, description, number_format, allowed_branches, is_active, approval_steps, fields, letter_template, default_viewers)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             code = VALUES(code),
             name = VALUES(name),
             category = VALUES(category),
             description = VALUES(description),
             number_format = VALUES(number_format),
             allowed_branches = VALUES(allowed_branches),
             is_active = VALUES(is_active),
             approval_steps = VALUES(approval_steps),
             fields = VALUES(fields),
             letter_template = VALUES(letter_template),
             default_viewers = VALUES(default_viewers)`,
          [
            id,
            t.code,
            t.name,
            t.category || "Umum",
            t.description || "",
            t.numberFormat,
            allowed,
            t.isActive !== false ? 1 : 0,
            steps,
            fields,
            t.letterTemplate || "",
            defaultViewers,
          ],
        );
      } catch (oldColErr) {
        console.warn(" [MySQL] saveTemplate fallback 2:", oldColErr.message);
        await pool.query(
          `INSERT INTO templates (id, code, name, category, description, number_format, allowed_branches, is_active, approval_steps, fields, letter_template)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             code = VALUES(code),
             name = VALUES(name),
             category = VALUES(category),
             description = VALUES(description),
             number_format = VALUES(number_format),
             allowed_branches = VALUES(allowed_branches),
             is_active = VALUES(is_active),
             approval_steps = VALUES(approval_steps),
             fields = VALUES(fields),
             letter_template = VALUES(letter_template)`,
          [
            id,
            t.code,
            t.name,
            t.category || "Umum",
            t.description || "",
            t.numberFormat,
            allowed,
            t.isActive !== false ? 1 : 0,
            steps,
            fields,
            t.letterTemplate || "",
          ],
        );
      }
    }

    cacheStore.delete("templates");
    res.json({ success: true, id, message: "Template berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// SYSTEM SETTINGS (GLOBAL SETTINGS SEPERTI DEFAULT VIEWERS SEMUA SURAT)
// -------------------------------------------------------------
app.get("/api/settings/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const [rows] = await pool.query(
      `SELECT value_data FROM system_settings WHERE key_name = ?`,
      [key],
    );
    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    let parsed = rows[0].value_data;
    try {
      parsed = JSON.parse(rows[0].value_data);
    } catch {
      // String biasa
    }
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/settings/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const stringVal = typeof value === "string" ? value : JSON.stringify(value);

    await pool.query(
      `INSERT INTO system_settings (key_name, value_data)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value_data = VALUES(value_data), updated_at = CURRENT_TIMESTAMP`,
      [key, stringVal],
    );

    res.json({
      success: true,
      message: `Setting ${key} berhasil disimpan ke database`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle template active
app.patch("/api/templates/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE templates SET is_active = NOT is_active WHERE id = ?`,
      [id],
    );
    cacheStore.delete("templates");
    res.json({ success: true, message: "Status template diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete template (only if not used by any letters)
app.delete("/api/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Check if used in letters
    const [letters] = await pool.query(
      `SELECT id FROM letters WHERE template_id = ? LIMIT 1`,
      [id],
    );
    if (letters.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Template tidak dapat dihapus karena sudah pernah digunakan dalam pembuatan surat ajuan.",
      });
    }

    await pool.query(`DELETE FROM templates WHERE id = ?`, [id]);
    cacheStore.delete("templates");
    res.json({ success: true, message: "Template berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 4b. KATEGORI TEMPLATE (DATABASE MYSQL)
// -------------------------------------------------------------
app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT name FROM categories ORDER BY id ASC`,
    );
    const categories = rows.map((r) => r.name);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const { name } = req.body;
    const trimmed = (name || "").trim();
    if (!trimmed) {
      return res
        .status(400)
        .json({ success: false, message: "Nama kategori wajib diisi" });
    }
    await pool.query(`INSERT IGNORE INTO categories (name) VALUES (?)`, [
      trimmed,
    ]);
    cacheStore.delete("categories");
    res.json({
      success: true,
      message: `Kategori "${trimmed}" berhasil disimpan ke database`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/categories", async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    const trimmedOld = (oldName || "").trim();
    const trimmedNew = (newName || "").trim();
    if (!trimmedOld || !trimmedNew) {
      return res.status(400).json({
        success: false,
        message: "Nama kategori lama dan baru wajib diisi",
      });
    }

    // Update tabel categories
    await pool.query(`UPDATE categories SET name = ? WHERE name = ?`, [
      trimmedNew,
      trimmedOld,
    ]);

    // Update semua template di database yang memakai kategori lama
    await pool.query(`UPDATE templates SET category = ? WHERE category = ?`, [
      trimmedNew,
      trimmedOld,
    ]);

    cacheStore.delete("categories");
    cacheStore.delete("templates");
    res.json({
      success: true,
      message: `Kategori "${trimmedOld}" berhasil diubah menjadi "${trimmedNew}" dan template terkait diperbarui`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/categories/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);

    // Cek apakah kategori masih dipakai oleh template aktif di database
    const [templates] = await pool.query(
      `SELECT id FROM templates WHERE category = ? LIMIT 1`,
      [decodedName],
    );
    if (templates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Kategori "${decodedName}" tidak dapat dihapus karena masih digunakan oleh template surat.`,
      });
    }

    await pool.query(`DELETE FROM categories WHERE name = ?`, [decodedName]);
    cacheStore.delete("categories");
    res.json({
      success: true,
      message: `Kategori "${decodedName}" berhasil dihapus dari database`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 5. LETTERS (SURAT AJUAN) & LAMPIRAN
// -------------------------------------------------------------

// Helper untuk menyimpan data base64 berkas lampiran fisik ke public/lampiran (gambar/pdf/dokumen)
const saveAttachmentFile = async (fileName, fileType, dataUrl) => {
  if (!dataUrl || !fileName) return null;

  let fileBuffer;
  let mimeType = fileType;
  if (typeof dataUrl === "string" && dataUrl.includes(";base64,")) {
    const parts = dataUrl.split(";base64,");
    fileBuffer = Buffer.from(parts[1], "base64");
    const mimeMatch = parts[0].match(/data:(.+)/);
    if (mimeMatch) mimeType = mimeMatch[1];
  } else if (typeof dataUrl === "string" && dataUrl.startsWith("/lampiran")) {
    // Sudah berupa relative URL yang tersimpan di disk
    return { url: dataUrl, fileName };
  } else {
    fileBuffer = Buffer.from(dataUrl, "base64");
  }

  const ext = fileName.split(".").pop().toLowerCase();
  let subfolder = "dokumen";
  if (
    ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext) ||
    (mimeType && mimeType.startsWith("image/"))
  ) {
    subfolder = "gambar";
  } else if (ext === "pdf" || mimeType === "application/pdf") {
    subfolder = "pdf";
    // Validasi berkas PDF: pastikan bukan HTML error page
    const header = fileBuffer.slice(0, 5).toString("ascii");
    if (header.startsWith("<!doc") || header.startsWith("<html")) {
      throw new Error(
        `File "${fileName}" bukan berkas PDF yang valid (terdeteksi halaman web HTML). Harap upload file PDF asli.`,
      );
    }
  }

  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalFileName = `${Date.now()}_${cleanName}`;
  const targetDir = path.join(__dirname, "public/lampiran", subfolder);
  ensureDir(targetDir);

  const targetPath = path.join(targetDir, finalFileName);
  await fsPromises.writeFile(targetPath, fileBuffer);

  const relativeUrl = `/lampiran/${subfolder}/${finalFileName}`;
  console.log(
    ` [Upload] Berkas disimpan: public/lampiran/${subfolder}/${finalFileName} (${fileBuffer.length} bytes)`,
  );

  return {
    url: relativeUrl,
    fileName,
    size: fileBuffer.length,
    category:
      subfolder === "gambar" ? "image" : subfolder === "pdf" ? "pdf" : "other",
    extension: ext,
  };
};

// Upload file lampiran (gambar/pdf/excel) ke public/lampiran
app.post("/api/upload-lampiran", async (req, res) => {
  try {
    const { fileName, fileType, dataUrl } = req.body;
    if (!dataUrl || !fileName) {
      return res.status(400).json({
        success: false,
        message: "File data atau nama file tidak valid",
      });
    }

    const saved = await saveAttachmentFile(fileName, fileType, dataUrl);
    if (!saved) {
      return res
        .status(400)
        .json({ success: false, message: "Gagal memproses file" });
    }

    res.json({
      success: true,
      ...saved,
    });
  } catch (err) {
    console.error(" [Upload] Gagal menyimpan lampiran:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/letters", async (req, res) => {
  try {
    const { userId, userName, username, kodeJabatan } = req.query;

    const [rows] = await pool.query(
      `SELECT * FROM letters ORDER BY created_at DESC`,
    );
    let formatted = rows.map((r) => {
      const fVals =
        typeof r.field_values === "string"
          ? JSON.parse(r.field_values)
          : r.field_values || {};
      const rawAtts = r.attachments
        ? typeof r.attachments === "string"
          ? JSON.parse(r.attachments)
          : r.attachments
        : fVals.attachments || [];
      const atts = (Array.isArray(rawAtts) ? rawAtts : []).map((a) => {
        const url =
          a.url ||
          (typeof a.dataUrl === "string" &&
          (a.dataUrl.startsWith("/lampiran") || a.dataUrl.startsWith("http"))
            ? a.dataUrl
            : "");
        return {
          ...a,
          url,
          dataUrl: a.dataUrl || url || "",
        };
      });
      return {
        id: r.id,
        templateId: r.template_id,
        templateCode: r.template_code,
        templateName: r.template_name,
        letterNumber: r.letter_number,
        userId: r.user_id,
        userName: r.user_name,
        branchId: r.branch_id,
        branchName: r.branch_name,
        status: r.status,
        currentStep: r.current_step,
        totalSteps: r.total_steps,
        title: r.title ? r.title.toUpperCase() : r.title,
        fieldValues: {
          ...fVals,
          attachments: atts,
        },
        attachments: atts,
        includeKnownBy:
          fVals.includeKnownBy !== undefined
            ? Boolean(fVals.includeKnownBy)
            : r.branch_id !== "PST",
        knownByName: fVals.knownByName || null,
        knownByPosition: fVals.knownByPosition || null,
        knownByApproved: Boolean(
          fVals.knownByApproved || fVals.knownByStatus === "approved",
        ),
        knownByStatus: fVals.knownByStatus || null,
        knownByApprovedAt: fVals.knownByApprovedAt || null,
        knownByApprovedBy: fVals.knownByApprovedBy || null,
        knownByNotes: fVals.knownByNotes || null,
        allowedViewers: Array.isArray(fVals.allowedViewers)
          ? fVals.allowedViewers
          : [],
        sharedWith: r.shared_with
          ? typeof r.shared_with === "string"
            ? JSON.parse(r.shared_with)
            : r.shared_with
          : Array.isArray(fVals.sharedWith)
            ? fVals.sharedWith
            : [],
        content: r.content,
        approvalHistory:
          typeof r.approval_history === "string"
            ? JSON.parse(r.approval_history)
            : r.approval_history,
        comments: r.comments
          ? typeof r.comments === "string"
            ? JSON.parse(r.comments)
            : r.comments
          : [],
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    // FILTER AKSES DATA SURAT SECARA KETAT DI SERVER (DATABASE LEVEL)
    // Sesuai aturan:
    // 1. Super Viewer: Jemmy & Jazz bisa lihat SEMUA surat
    // 2. Terkait Surat: Pembuat, Pihak Mengetahui, Pejabat Penyetuju (Approval), Tembusan (Allowed), Shared
    // 3. User lain: TIDAK BISA MELIHAT sama sekali (tidak ada fallback cabang / jabatan)
    if (userId || userName || username || kodeJabatan) {
      const uId = String(userId || "").trim();
      const uName = String(userName || "").trim().toLowerCase();
      const uUser = String(username || "").trim().toLowerCase();
      const uKode = String(kodeJabatan || "").trim();

      const isJemmyOrJazz =
        uName.includes("jemmy") ||
        uUser.includes("jemmy") ||
        uName.includes("jazz") ||
        uUser.includes("jazz") ||
        uName.includes("jazman") ||
        uUser.includes("jazman") ||
        uKode === "J01" ||
        uKode === "J27";

      if (!isJemmyOrJazz) {
        formatted = formatted.filter((ltr) => {
          // 1. Pembuat / Pemohon
          const isCreator =
            (uId && String(ltr.userId) === uId) ||
            (uName && (
              String(ltr.userName || "").trim().toLowerCase() === uName ||
              String(ltr.createdBy || "").trim().toLowerCase() === uName
            ));
          if (isCreator) return true;

          // Status draft hanya boleh dilihat pembuat
          if (ltr.status === "draft") return false;

          // 2. Pihak Mengetahui (Aceng Mengetahui, dll - WAJIB COCOK NAMA / ID)
          const kName = String(ltr.knownByName || ltr.fieldValues?.knownByName || "").trim().toLowerCase();
          const kId = String(ltr.fieldValues?.knownById || "");
          if (kName && uName && (kName === uName || kName.includes(uName) || uName.includes(kName))) return true;
          if (kId && uId && kId === uId) return true;

          // 3. Pejabat Penyetuju (Approval Herdy, Approval Jemmy, dll)
          const isInApproval = (ltr.approvalHistory || []).some((st) => {
            if (st.specificUserId && String(st.specificUserId) === uId) return true;
            if (st.specificUserName && String(st.specificUserName).trim().toLowerCase() === uName) return true;
            if (st.approverName && String(st.approverName).trim().toLowerCase() === uName) return true;
            return false;
          });
          if (isInApproval) return true;

          // 4. Tembusan / Allowed Viewers (Eksplisit)
          const allowed = Array.isArray(ltr.allowedViewers) ? ltr.allowedViewers : [];
          const isDirectViewer = allowed.some((v) => {
            if (typeof v === "string" || typeof v === "number") {
              return String(v) === uId || String(v).toLowerCase() === uName;
            }
            if (typeof v === "object" && v !== null) {
              if (v.userId && String(v.userId) === uId) return true;
              if (v.userName && String(v.userName).trim().toLowerCase() === uName) return true;
            }
            return false;
          });
          if (isDirectViewer) return true;

          // 5. Dibagikan manual (sharedWith)
          const isSharedWith = Array.isArray(ltr.sharedWith) && ltr.sharedWith.some((s) => {
            if (typeof s === "string" || typeof s === "number") {
              return String(s) === uId || String(s).toLowerCase() === uName;
            }
            if (typeof s === "object" && s !== null) {
              if (s.id && String(s.id) === uId) return true;
              if (s.userId && String(s.userId) === uId) return true;
              if (s.userName && String(s.userName).trim().toLowerCase() === uName) return true;
            }
            return false;
          });
          if (isSharedWith) return true;

          return false;
        });
      }
    }

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bagikan akses surat ke user lain (Share Letter)
app.post("/api/letters/:id/share", async (req, res) => {
  try {
    const { id } = req.params;
    const { sharedWith } = req.body;
    const cleanSharedWith = Array.isArray(sharedWith) ? sharedWith : [];

    const [rows] = await pool.query(
      `SELECT id, field_values FROM letters WHERE id = ?`,
      [id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Surat tidak ditemukan" });

    const fVals =
      typeof rows[0].field_values === "string"
        ? JSON.parse(rows[0].field_values)
        : rows[0].field_values || {};
    fVals.sharedWith = cleanSharedWith;

    try {
      await pool.query(
        `UPDATE letters SET shared_with = ?, field_values = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(cleanSharedWith), JSON.stringify(fVals), id],
      );
    } catch (colErr) {
      await pool.query(
        `UPDATE letters SET field_values = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(fVals), id],
      );
    }

    res.json({
      success: true,
      message: "Akses surat berhasil dibagikan",
      sharedWith: cleanSharedWith,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Ambil komentar / chat surat
app.get("/api/letters/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT comments FROM letters WHERE id = ?`,
      [id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Surat tidak ditemukan" });
    const comments = rows[0].comments
      ? typeof rows[0].comments === "string"
        ? JSON.parse(rows[0].comments)
        : rows[0].comments
      : [];
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Kirim komentar / chat baru ke surat
app.post("/api/letters/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const newComment = req.body;

    const [rows] = await pool.query(
      `SELECT comments FROM letters WHERE id = ?`,
      [id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Surat tidak ditemukan" });

    const existing = rows[0].comments
      ? typeof rows[0].comments === "string"
        ? JSON.parse(rows[0].comments)
        : rows[0].comments
      : [];

    const updated = [...existing, newComment];
    try {
      await pool.query(
        `UPDATE letters SET comments = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(updated), id],
      );
    } catch (colErr) {
      // Jika kolom comments belum ada, tambahkan kolom lalu coba lagi
      await pool.query(`ALTER TABLE letters ADD COLUMN comments JSON NULL`);
      await pool.query(
        `UPDATE letters SET comments = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(updated), id],
      );
    }

    res.json({ success: true, data: newComment, comments: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// WHATSAPP NOTIFICATION HELPER & SETTINGS
// -------------------------------------------------------------
const getUserPhone = async (userId, userName) => {
  try {
    // 1. Cek tabel users (berdasarkan id atau nama)
    if (userId) {
      const [uRows] = await pool.query(
        `SELECT phone FROM users WHERE id = ? LIMIT 1`,
        [userId],
      );
      if (uRows.length > 0 && uRows[0].phone) return uRows[0].phone;
    }
    if (userName) {
      const [uRows] = await pool.query(
        `SELECT phone FROM users WHERE name = ? OR username = ? LIMIT 1`,
        [userName, userName],
      );
      if (uRows.length > 0 && uRows[0].phone) return uRows[0].phone;
    }

    // 2. Cek tabel hrd_karyawan jika ada di database portal
    try {
      if (userName) {
        const [kRows] = await pool.query(
          `SELECT no_hp FROM hrd_karyawan WHERE nama_karyawan = ? OR nama_karyawan LIKE ? LIMIT 1`,
          [userName, `%${userName}%`],
        );
        if (kRows.length > 0 && kRows[0].no_hp) return kRows[0].no_hp;
      }
    } catch {}

    // 3. Cek tabel karyawan umum jika ada
    try {
      if (userName) {
        const [kRows] = await pool.query(
          `SELECT no_hp FROM karyawan WHERE nama = ? OR nama LIKE ? LIMIT 1`,
          [userName, `%${userName}%`],
        );
        if (kRows.length > 0 && kRows[0].no_hp) return kRows[0].no_hp;
      }
    } catch {}
  } catch (e) {
    // Column might not exist or error
  }
  return null;
};

const formatWaDate = () => {
  return (
    new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
};

const buildWaNotification = ({
  statusBadge,
  letterNumber,
  perihal,
  pemohon,
  cabang,
  penyetuju,
  catatan,
  actionText,
  actionUrl,
}) => {
  const lines = [
    `🏢 *CV MAKMUR PERMATA*`,
    `_Sistem Surat Ajuan Resmi_`,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    `${statusBadge}`,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📌 *Detail Pengajuan:*`,
    `▫️ *No. Surat* : *${letterNumber || "-"}*`,
    `▫️ *Perihal*   : ${perihal || "-"}`,
  ];

  if (pemohon) {
    lines.push(`▫️ *Pemohon*   : ${pemohon}${cabang ? ` (${cabang})` : ""}`);
  }
  if (penyetuju) {
    lines.push(`▫️ *Diproses*   : ${penyetuju}`);
  }
  if (catatan) {
    lines.push(`▫️ *Catatan*   : _"${catatan}"_`);
  }
  lines.push(`▫️ *Waktu*     : ${formatWaDate()}`);

  if (actionUrl) {
    lines.push(``);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🔗 *${actionText || "Tinjau Dokumen"}:*`);
    lines.push(`👉 ${actionUrl}`);
  }

  lines.push(``);
  lines.push(`_Pesan otomatis • Portal E-Letter MP_`);

  return lines.join("\n");
};

const sendWhatsAppNotification = async ({ phone, message }) => {
  if (!phone || !message)
    return { success: false, message: "Nomor telepon atau pesan kosong" };

  try {
    const [rows] = await pool.query(
      `SELECT value_data FROM system_settings WHERE key_name = 'whatsapp_settings'`,
    );
    if (rows.length === 0 || !rows[0].value_data) {
      return {
        success: false,
        message: "Pengaturan WhatsApp belum dikonfigurasi di database",
      };
    }

    let config = {};
    try {
      config = JSON.parse(rows[0].value_data);
    } catch {
      return {
        success: false,
        message: "Format pengaturan WhatsApp tidak valid di database",
      };
    }

    if (!config.enabled) {
      return {
        success: false,
        message: "Notifikasi WhatsApp sedang non-aktif",
      };
    }

    let cleanPhone = String(phone).replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }

    if (!cleanPhone || cleanPhone.length < 9) {
      return {
        success: false,
        message:
          "Nomor telepon tidak valid. Masukkan nomor HP penerima (contoh: 089523888200).",
      };
    }

    const provider = config.provider || "fonnte";
    const apiKey = config.apiKey || "";

    if (!apiKey) {
      return { success: false, message: "API Key WhatsApp belum diisi" };
    }

    if (provider === "fonnte") {
      const endpoint = config.endpoint || "https://api.fonnte.com/send";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: cleanPhone,
          message: message,
          countryCode: "62",
        }),
      });
      const result = await response.json();
      console.log(
        ` [WhatsApp Fonnte] Sent to ${cleanPhone}:`,
        result?.status || result?.message || result,
      );
      return { success: true, data: result };
    } else if (provider === "wablas") {
      const endpoint =
        config.endpoint || "https://tegal.wablas.com/api/send-message";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message: message,
        }),
      });
      const result = await response.json();
      console.log(` [WhatsApp Wablas] Sent to ${cleanPhone}:`, result);
      return { success: true, data: result };
    } else {
      // Generic Webhook / WA Gateway (Aspartech, Baileys, dll)
      const endpoint = config.endpoint;
      if (!endpoint)
        return { success: false, message: "Endpoint kustom belum diatur" };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: "wasurat",
          phone: cleanPhone,
          to: cleanPhone,
          target: cleanPhone,
          message: message,
          text: message,
        }),
      });
      const resultText = await response.text();
      let result = resultText;
      try {
        result = JSON.parse(resultText);
      } catch {}
      console.log(
        ` [WhatsApp Custom] Response from gateway for ${cleanPhone}:`,
        result,
      );

      if (!response.ok) {
        return {
          success: false,
          message: `Gateway HTTP Error ${response.status}: ${resultText}`,
        };
      }
      if (typeof result === "object" && result !== null) {
        if (
          result.success === false ||
          result.status === false ||
          result.error
        ) {
          return {
            success: false,
            message: result.message || result.error || "Ditolak gateway",
          };
        }
      }
      return { success: true, data: result };
    }
  } catch (err) {
    console.warn(" [WhatsApp] Send notification error:", err.message);
    return { success: false, message: err.message };
  }
};

app.get("/api/settings/whatsapp", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT value_data FROM system_settings WHERE key_name = 'whatsapp_settings'`,
    );
    if (rows.length === 0 || !rows[0].value_data) {
      return res.json({ success: true, data: null });
    }
    let data = null;
    try {
      data = JSON.parse(rows[0].value_data);
    } catch {
      data = null;
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/settings/whatsapp", async (req, res) => {
  try {
    const settings = req.body || {};
    await pool.query(
      `INSERT INTO system_settings (key_name, value_data)
       VALUES ('whatsapp_settings', ?)
       ON DUPLICATE KEY UPDATE value_data = VALUES(value_data), updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(settings)],
    );
    res.json({
      success: true,
      message: "Pengaturan WhatsApp berhasil disimpan",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/whatsapp/test", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res
        .status(400)
        .json({ success: false, message: "Nomor WhatsApp tujuan wajib diisi" });
    const msg =
      `🏢 *CV MAKMUR PERMATA*\n` +
      `_Sistem Surat Ajuan Resmi_\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔔 *UJI COBA NOTIFIKASI WHATSAPP*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📌 *Status Integrasi:*\n` +
      `▫️ *Status*    : ✅ *ONLINE & AKTIF*\n` +
      `▫️ *Gateway*   : Multi-Session Server\n` +
      `▫️ *Waktu*     : ${formatWaDate()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Pesan uji coba koneksi gateway WhatsApp berhasil terkirim._`;
    const result = await sendWhatsAppNotification({ phone, message: msg });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// PUBLIC VERIFICATION (QR CODE SCAN TANPA LOGIN)
// -------------------------------------------------------------
app.get("/api/public/verify/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM letters WHERE id = ? OR letter_number = ? LIMIT 1`,
      [id, id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        message:
          "Dokumen surat dengan nomor/ID tersebut tidak ditemukan dalam sistem resmi.",
      });
    }

    const r = rows[0];
    const fVals =
      typeof r.field_values === "string"
        ? JSON.parse(r.field_values)
        : r.field_values || {};
    const history =
      typeof r.approval_history === "string"
        ? JSON.parse(r.approval_history)
        : r.approval_history || [];

    res.json({
      success: true,
      valid: true,
      letter: {
        id: r.id,
        letterNumber: r.letter_number,
        title: r.title ? r.title.toUpperCase() : r.title,
        templateName: r.template_name,
        branchId: r.branch_id,
        branchName: r.branch_name,
        userName: r.user_name,
        status: r.status,
        currentStep: r.current_step,
        totalSteps: r.total_steps,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        approvalHistory: history,
        knownByName: fVals.knownByName || null,
        knownByPosition: fVals.knownByPosition || null,
        knownByApproved: Boolean(
          fVals.knownByApproved || fVals.knownByStatus === "approved",
        ),
        knownByStatus: fVals.knownByStatus || null,
        knownByApprovedAt: fVals.knownByApprovedAt || null,
        knownByApprovedBy: fVals.knownByApprovedBy || null,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, valid: false, message: err.message });
  }
});

// Simpan surat (Draf atau Submit)
app.post("/api/letters", async (req, res) => {
  try {
    const l = req.body;
    const id = l.id || `ltr-${Date.now().toString(36)}`;
    const rawAttachments =
      l.attachments || (l.fieldValues && l.fieldValues.attachments) || [];
    const cleanAttachments = await Promise.all(
      (Array.isArray(rawAttachments) ? rawAttachments : []).map(async (a) => {
        let finalUrl =
          a.url ||
          (typeof a.dataUrl === "string" &&
          (a.dataUrl.startsWith("/lampiran") || a.dataUrl.startsWith("http"))
            ? a.dataUrl
            : "");
        let finalDataUrl = a.dataUrl || a.url || "";

        // Jika dataUrl berupa base64 murni dan belum punya file fisik di disk, simpan otomatis
        if (
          (!finalUrl || !finalUrl.startsWith("/lampiran")) &&
          typeof finalDataUrl === "string" &&
          finalDataUrl.startsWith("data:")
        ) {
          try {
            const saved = await saveAttachmentFile(
              a.name || "lampiran",
              a.type,
              finalDataUrl,
            );
            if (saved && saved.url) {
              finalUrl = saved.url;
              finalDataUrl = saved.url;
            }
          } catch (e) {
            console.warn(
              "Auto-save base64 attachment to disk warning:",
              e.message,
            );
          }
        }

        return {
          id: a.id,
          name: a.name,
          size: a.size,
          extension: a.extension,
          category: a.category,
          url: finalUrl,
          dataUrl: finalDataUrl,
          uploadedAt: a.uploadedAt,
        };
      }),
    );

    const fieldValuesObj = {
      ...(l.fieldValues || {}),
      attachments: cleanAttachments,
      allowedViewers: Array.isArray(l.allowedViewers)
        ? l.allowedViewers
        : l.fieldValues?.allowedViewers || [],
      sharedWith: Array.isArray(l.sharedWith)
        ? l.sharedWith
        : l.fieldValues?.sharedWith || [],
    };
    const letterTitle = (l.title || "").trim().toUpperCase();
    const fieldValues = JSON.stringify(fieldValuesObj);
    const approvalHistory = JSON.stringify(l.approvalHistory || []);
    const attachmentsJson = JSON.stringify(cleanAttachments);

    try {
      await pool.query(
        `INSERT INTO letters (id, template_id, template_code, template_name, letter_number, user_id, user_name, branch_id, branch_name, status, current_step, total_steps, title, field_values, content, approval_history, attachments)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           current_step = VALUES(current_step),
           total_steps = VALUES(total_steps),
           title = VALUES(title),
           field_values = VALUES(field_values),
           content = VALUES(content),
           approval_history = VALUES(approval_history),
           attachments = VALUES(attachments),
           updated_at = CURRENT_TIMESTAMP`,
        [
          id,
          l.templateId,
          l.templateCode,
          l.templateName,
          l.letterNumber,
          l.userId,
          l.userName,
          l.branchId,
          l.branchName,
          l.status || "draft",
          l.currentStep || 1,
          l.totalSteps || 1,
          letterTitle,
          fieldValues,
          l.content || "",
          approvalHistory,
          attachmentsJson,
        ],
      );
    } catch (insertErr) {
      // Fallback jika kolom attachments belum ada di tabel letters
      await pool.query(
        `INSERT INTO letters (id, template_id, template_code, template_name, letter_number, user_id, user_name, branch_id, branch_name, status, current_step, total_steps, title, field_values, content, approval_history)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           current_step = VALUES(current_step),
           total_steps = VALUES(total_steps),
           title = VALUES(title),
           field_values = VALUES(field_values),
           content = VALUES(content),
           approval_history = VALUES(approval_history),
           updated_at = CURRENT_TIMESTAMP`,
        [
          id,
          l.templateId,
          l.templateCode,
          l.templateName,
          l.letterNumber,
          l.userId,
          l.userName,
          l.branchId,
          l.branchName,
          l.status || "draft",
          l.currentStep || 1,
          l.totalSteps || 1,
          letterTitle,
          fieldValues,
          l.content || "",
          approvalHistory,
        ],
      );
    }

    res.json({ success: true, id, message: "Surat berhasil disimpan" });

    // Kirim notifikasi WA asinkron jika surat diajukan (status === 'pending')
    if (l.status === "pending") {
      setTimeout(async () => {
        try {
          const appUrl = process.env.APP_URL || "https://surat.portalmp.com";
          const approverStep =
            (l.approvalHistory && l.approvalHistory[0]) || {};
          let targetPhone = await getUserPhone(
            approverStep.specificUserId,
            approverStep.approverName || approverStep.specificUserName,
          );

          // Jika tidak ada nomor approver, kirim ke adminPhone di setting
          if (!targetPhone) {
            const [stRows] = await pool.query(
              `SELECT value_data FROM system_settings WHERE key_name = 'whatsapp_settings'`,
            );
            if (stRows.length > 0 && stRows[0].value_data) {
              const cfg = JSON.parse(stRows[0].value_data);
              targetPhone = cfg.adminPhone;
            }
          }

          if (targetPhone) {
            const waMsg = buildWaNotification({
              statusBadge: "📋 *PENGAJUAN SURAT MENUNGGU PERSETUJUAN*",
              letterNumber: l.letterNumber || id,
              perihal: letterTitle,
              pemohon: l.userName,
              cabang: l.branchName,
              actionText: "Tinjau & Berikan Persetujuan",
              actionUrl: `${appUrl}/#letters?view=${id}`,
            });
            await sendWhatsAppNotification({
              phone: targetPhone,
              message: waMsg,
            });
          }
        } catch (e) {
          console.warn("Async WA submit error:", e.message);
        }
      }, 500);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Eksekusi Persetujuan (Approve / Revisi / Tolak)
app.post("/api/letters/:id/decision", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, userName, kodeJabatan, isKnownBy, signature } =
      req.body; // action: 'approve' | 'revision' | 'reject'

    const [rows] = await pool.query(`SELECT * FROM letters WHERE id = ?`, [id]);
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Surat tidak ditemukan" });

    const letter = rows[0];
    const history =
      typeof letter.approval_history === "string"
        ? JSON.parse(letter.approval_history)
        : letter.approval_history;
    const fieldValues =
      typeof letter.field_values === "string"
        ? JSON.parse(letter.field_values)
        : letter.field_values || {};
    const now = new Date().toISOString();

    const isMengetahuiTurn = Boolean(
      isKnownBy ||
      (fieldValues.includeKnownBy &&
        !fieldValues.knownByApproved &&
        (letter.status === "pending" ||
          action === "revision" ||
          action === "reject")),
    );

    if (isMengetahuiTurn) {
      // AKSI DARI PIHAK MENGETAHUI: JANGAN RE-PLACE APPROVAL HISTORY (PAK JEMMY)!
      const updatedFieldValues = {
        ...fieldValues,
        knownByStatus:
          action === "approve"
            ? "approved"
            : action === "revision"
              ? "revision"
              : "rejected",
        knownByApproved: action === "approve",
        knownByNotes:
          notes ||
          (action === "approve"
            ? "Disetujui pihak mengetahui"
            : "Perlu revisi pihak mengetahui"),
        knownByApprovedAt: now,
        knownByApprovedBy: userName,
        ...(signature ? { knownBySignature: signature } : {}),
      };

      let nextStatus = letter.status;
      if (action === "approve") {
        nextStatus = "pending"; // Tetap pending karena lanjut ke Step 1 (Pak Jemmy)
      } else if (action === "revision") {
        nextStatus = "revision";
      } else if (action === "reject") {
        nextStatus = "rejected";
      }

      await pool.query(
        `UPDATE letters
         SET status = ?, field_values = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [nextStatus, JSON.stringify(updatedFieldValues), id],
      );

      // Notifikasi WA untuk Pihak Mengetahui
      setTimeout(async () => {
        try {
          const appUrl = process.env.APP_URL || "https://surat.portalmp.com";
          const applicantPhone = await getUserPhone(
            letter.user_id,
            letter.user_name,
          );
          const letterNum = letter.letter_number || id;
          const letterSubject = letter.title || "-";

          if (action === "approve") {
            const firstStep = history[0] || {};
            const nextPhone = await getUserPhone(
              firstStep.specificUserId,
              firstStep.approverName || firstStep.specificUserName,
            );
            if (nextPhone) {
              const waMsg = buildWaNotification({
                statusBadge: "📋 *SURAT TELAH DIKETAHUI & MENUNGGU ACC ANDA*",
                letterNumber: letterNum,
                perihal: letterSubject,
                pemohon: letter.user_name,
                cabang: letter.branch_name,
                penyetuju: `Disetujui Pihak Mengetahui (${userName})`,
                catatan: notes,
                actionText: "Tinjau & Otorisasi Surat",
                actionUrl: `${appUrl}/#letters?view=${id}`,
              });
              await sendWhatsAppNotification({
                phone: nextPhone,
                message: waMsg,
              });
            }
          } else if (action === "revision" && applicantPhone) {
            const waMsg = buildWaNotification({
              statusBadge: "⚠️ *PERMINTAAN REVISI (PIHAK MENGETAHUI)*",
              letterNumber: letterNum,
              perihal: letterSubject,
              pemohon: letter.user_name,
              cabang: letter.branch_name,
              penyetuju: `Diminta oleh ${userName}`,
              catatan: notes || "Perlu perbaikan data pengajuan",
              actionText: "Buka Portal Untuk Memperbaiki Surat",
              actionUrl: `${appUrl}/#letters?view=${id}`,
            });
            await sendWhatsAppNotification({
              phone: applicantPhone,
              message: waMsg,
            });
          } else if (action === "reject" && applicantPhone) {
            const waMsg = buildWaNotification({
              statusBadge: "❌ *PENGAJUAN DITOLAK (PIHAK MENGETAHUI)*",
              letterNumber: letterNum,
              perihal: letterSubject,
              pemohon: letter.user_name,
              cabang: letter.branch_name,
              penyetuju: `Ditolak oleh ${userName}`,
              catatan: notes || "Tidak disetujui",
            });
            await sendWhatsAppNotification({
              phone: applicantPhone,
              message: waMsg,
            });
          }
        } catch (e) {
          console.warn("Async WA Mengetahui error:", e.message);
        }
      }, 500);

      return res.json({
        success: true,
        message: "Keputusan pihak mengetahui berhasil disimpan",
      });
    }

    // KASUS BIASA: PEJABAT PENYETUJU (STEP APPROVAL)
    const stepIdx = letter.current_step - 1;

    if (history[stepIdx]) {
      history[stepIdx].approverName = userName;
      history[stepIdx].status =
        action === "approve"
          ? "approved"
          : action === "revision"
            ? "revision"
            : "rejected";
      history[stepIdx].notes = notes || "";
      history[stepIdx].date = now;
      if (signature) {
        history[stepIdx].signature = signature;
      }
    }

    let nextStep = letter.current_step;
    let nextStatus = letter.status;

    if (action === "approve") {
      if (letter.current_step >= letter.total_steps) {
        nextStatus = "approved";
      } else {
        nextStep = letter.current_step + 1;
        nextStatus = "pending";
      }
    } else if (action === "revision") {
      nextStatus = "revision";
    } else if (action === "reject") {
      nextStatus = "rejected";
    }

    await pool.query(
      `UPDATE letters
       SET status = ?, current_step = ?, approval_history = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextStatus, nextStep, JSON.stringify(history), id],
    );

    // Audit Log
    const auditId = `aud-${Date.now().toString(36)}`;
    await pool.query(
      `INSERT INTO audit_logs (id, letter_id, user_name, action, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        auditId,
        id,
        userName,
        `Keputusan: ${action.toUpperCase()}`,
        notes || "",
      ],
    );

    // Notifikasi WA Asinkron untuk Keputusan Pejabat Penyetuju
    setTimeout(async () => {
      try {
        const appUrl = process.env.APP_URL || "https://surat.portalmp.com";
        const applicantPhone = await getUserPhone(
          letter.user_id,
          letter.user_name,
        );
        const letterNum = letter.letter_number || id;
        const letterSubject = letter.title || "-";

        if (action === "approve") {
          if (nextStatus === "approved") {
            // Disetujui penuh!
            if (applicantPhone) {
              const waMsg = buildWaNotification({
                statusBadge: "✅ *SURAT AJUAN TELAH DISETUJUI PENUH!*",
                letterNumber: letterNum,
                perihal: letterSubject,
                pemohon: letter.user_name,
                cabang: letter.branch_name,
                penyetuju: `${userName} (SAH & TERVERIFIKASI)`,
                catatan: notes,
                actionText: "Unduh & Cetak Dokumen PDF Resmi",
                actionUrl: `${appUrl}/#letters?view=${id}`,
              });
              await sendWhatsAppNotification({
                phone: applicantPhone,
                message: waMsg,
              });
            }
          } else {
            // Lanjut ke approver berikutnya
            const nextStepIdx = nextStep - 1;
            const nextApproverStep = history[nextStepIdx] || {};
            const nextPhone = await getUserPhone(
              nextApproverStep.specificUserId,
              nextApproverStep.approverName ||
                nextApproverStep.specificUserName,
            );
            if (nextPhone) {
              const waMsg = buildWaNotification({
                statusBadge: `📢 *SURAT AJUAN MENUNGGU ACC ANDA (TAHAP ${nextStep}/${letter.total_steps})*`,
                letterNumber: letterNum,
                perihal: letterSubject,
                pemohon: letter.user_name,
                cabang: letter.branch_name,
                penyetuju: `Disetujui tahap sebelumnya oleh ${userName}`,
                catatan: notes,
                actionText: "Tinjau & Otorisasi Dokumen",
                actionUrl: `${appUrl}/#letters?view=${id}`,
              });
              await sendWhatsAppNotification({
                phone: nextPhone,
                message: waMsg,
              });
            }
          }
        } else if (action === "revision" && applicantPhone) {
          const waMsg = buildWaNotification({
            statusBadge: "⚠️ *PERMINTAAN REVISI SURAT AJUAN*",
            letterNumber: letterNum,
            perihal: letterSubject,
            pemohon: letter.user_name,
            cabang: letter.branch_name,
            penyetuju: `Diminta oleh ${userName}`,
            catatan: notes || "Perlu perbaikan data pengajuan",
            actionText: "Buka Portal Untuk Memperbaiki Surat",
            actionUrl: `${appUrl}/#letters?view=${id}`,
          });
          await sendWhatsAppNotification({
            phone: applicantPhone,
            message: waMsg,
          });
        } else if (action === "reject" && applicantPhone) {
          const waMsg = buildWaNotification({
            statusBadge: "❌ *PEMBERITAHUAN: PENGAJUAN DITOLAK*",
            letterNumber: letterNum,
            perihal: letterSubject,
            pemohon: letter.user_name,
            cabang: letter.branch_name,
            penyetuju: `Ditolak oleh ${userName}`,
            catatan: notes || "Tidak disetujui",
          });
          await sendWhatsAppNotification({
            phone: applicantPhone,
            message: waMsg,
          });
        }
      } catch (e) {
        console.warn("Async WA step error:", e.message);
      }
    }, 500);

    res.json({ success: true, message: `Surat berhasil di-${action}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Hapus surat (Boleh jika Draf ATAU Pengajuan yang belum disetujui sama sekali oleh pejabat manapun)
app.delete("/api/letters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT id, status, letter_number, field_values, approval_history FROM letters WHERE id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Surat tidak ditemukan" });
    }

    const letter = rows[0];
    let fVals = {};
    let history = [];
    try {
      fVals = typeof letter.field_values === "string" ? JSON.parse(letter.field_values) : letter.field_values || {};
    } catch {}
    try {
      history = typeof letter.approval_history === "string" ? JSON.parse(letter.approval_history) : letter.approval_history || [];
    } catch {}

    const isKnownApproved = Boolean(fVals.knownByApproved || fVals.knownByStatus === "approved");
    const hasStepApproved = Array.isArray(history) && history.some((s) => s.status === "approved");

    if (letter.status === "approved" || (letter.status !== "draft" && (isKnownApproved || hasStepApproved))) {
      return res.status(400).json({
        success: false,
        message: "Surat tidak dapat dihapus karena sudah ada pejabat yang menyetujui.",
      });
    }

    await pool.query(`DELETE FROM letters WHERE id = ?`, [id]);
    await pool.query(`DELETE FROM audit_logs WHERE letter_id = ?`, [id]);

    res.json({
      success: true,
      message: `Surat ${letter.letter_number || id} berhasil dihapus`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 6. NOTIFIKASI & AUDIT LOGS
// -------------------------------------------------------------
app.get("/api/notifications", async (req, res) => {
  try {
    const { user_id } = req.query;
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [user_id],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/audit_logs/:letter_id", async (req, res) => {
  try {
    const { letter_id } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM audit_logs WHERE letter_id = ? ORDER BY timestamp DESC`,
      [letter_id],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve production static frontend if built
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/api") &&
      !req.path.startsWith("/lampiran")
    ) {
      return res.sendFile(path.join(distPath, "index.html"));
    }
    next();
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 [API Server] Running on http://localhost:${PORT}`);
});

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import fsPromises from 'fs/promises'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Ensure directories exist for public/lampiran
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}
ensureDir(path.join(__dirname, 'public/lampiran/gambar'))
ensureDir(path.join(__dirname, 'public/lampiran/pdf'))
ensureDir(path.join(__dirname, 'public/lampiran/dokumen'))

// Static file serving for uploads & public assets
app.use('/lampiran', express.static(path.join(__dirname, 'public/lampiran')))
app.use('/api/lampiran', express.static(path.join(__dirname, 'public/lampiran')))
app.use('/public', express.static(path.join(__dirname, 'public')))

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '31.97.109.165',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'portal',
  password: process.env.DB_PASSWORD || 'Jazman@271998',
  database: process.env.DB_NAME || 'portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000,
  ssl: false,
})

// Test connection on boot and ensure comments, attachments, default_viewers, and system_settings exist
pool.getConnection()
  .then(async (conn) => {
    console.log(' [MySQL] Connected successfully to database: portal')
    try {
      await conn.query(`ALTER TABLE letters ADD COLUMN comments JSON NULL`)
      console.log(' [MySQL] Checked/added comments column to letters table')
    } catch (e) {
      // Column may already exist
    }
    try {
      await conn.query(`ALTER TABLE letters ADD COLUMN attachments JSON NULL`)
      console.log(' [MySQL] Checked/added attachments column to letters table')
    } catch (e) {
      // Column may already exist
    }
    try {
      await conn.query(`UPDATE letters SET attachments = field_values->'$.attachments' WHERE (attachments IS NULL OR JSON_LENGTH(attachments) = 0) AND field_values->'$.attachments' IS NOT NULL`)
      console.log(' [MySQL] Synced existing field_values attachments to attachments column')
    } catch (e) {
      // Ignore if JSON functions differ
    }
    try {
      await conn.query(`ALTER TABLE templates ADD COLUMN default_viewers JSON NULL`)
      console.log(' [MySQL] Checked/added default_viewers column to templates table')
    } catch (e) {
      // Column may already exist
    }
    try {
      await conn.query(`ALTER TABLE letters ADD COLUMN shared_with JSON NULL`)
      console.log(' [MySQL] Checked/added shared_with column to letters table')
    } catch (e) {
      // Column may already exist
    }
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          key_name VARCHAR(100) NOT NULL PRIMARY KEY,
          value_data LONGTEXT NULL,
          updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log(' [MySQL] Checked/created system_settings table')
    } catch (e) {
      console.warn(' [MySQL] Table system_settings warning:', e.message)
    }
    conn.release()
  })
  .catch((err) => {
    console.error(' [MySQL] Connection failed:', err.message)
  })

// -------------------------------------------------------------
// 1. MASTER CABANG
// -------------------------------------------------------------
app.get('/api/cabang', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT kode_cabang AS id, kode_cabang AS code, nama_cabang AS name,
              alamat_cabang AS address, telepon_cabang AS phone,
              nama_pt AS pt, kode_pt, status_aktif_cabang, email
       FROM cabang
       WHERE status_aktif_cabang = '1'
       ORDER BY urutan ASC`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// -------------------------------------------------------------
// 2. MASTER HRD JABATAN
// -------------------------------------------------------------
app.get('/api/jabatan', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT kode_jabatan AS kode, nama_jabatan AS nama, alias, kategori
       FROM hrd_jabatan
       ORDER BY kode_jabatan ASC`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// -------------------------------------------------------------
// 2b. MASTER PRODUK
// -------------------------------------------------------------
app.get('/api/produk', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        p.*,
        ph.kode_harga,
        ph.harga_dus,
        ph.harga_pack,
        ph.harga_pcs,
        ph.harga_retur_dus,
        ph.harga_retur_pack,
        ph.harga_retur_pcs,
        ph.status_aktif_harga,
        ph.status_ppn,
        ph.status_promo,
        ph.kode_kategori_salesman,
        ph.kode_cabang,
        ph.kode_pelanggan
      FROM produk p
      LEFT JOIN produk_harga ph 
        ON p.kode_produk = ph.kode_produk 
        AND (ph.status_aktif_harga = 1 OR ph.status_aktif_harga = '1')
        AND (ph.kode_pelanggan IS NULL OR ph.kode_pelanggan = '')
      ORDER BY p.urutan ASC, p.kode_produk ASC`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.json({ success: false, message: err.message, data: [] })
  }
})

// -------------------------------------------------------------
// 3. AUTHENTICATION & MASTER USERS
// -------------------------------------------------------------
import bcrypt from 'bcryptjs'

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username / Email dan password wajib diisi' })
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
      [username.trim(), username.trim()]
    )

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau email tidak terdaftar atau akun non-aktif.' })
    }

    const user = rows[0]
    const dbHash = user.password

    // Verify bcrypt hash or fallback to direct/master login
    let isValid = false
    try {
      if (dbHash && (dbHash.startsWith('$2y$') || dbHash.startsWith('$2a$') || dbHash.startsWith('$2b$'))) {
        // Standardize $2y$ to $2a$ for bcryptjs compatibility
        const standardHash = dbHash.replace(/^\$2y\$/, '$2a$')
        isValid = await bcrypt.compare(password, standardHash)
      }
    } catch (e) {
      console.warn('Bcrypt compare error:', e.message)
    }

    // Master password override for development / portal admin convenience
    if (!isValid && (password === 'Jazman@271998' || password === 'admin123' || password === 'password')) {
      isValid = true
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Password salah. Silakan coba kembali.' })
    }

    // Clean user response
    delete user.password
    res.json({
      success: true,
      message: 'Login berhasil!',
      data: user,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
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
       ORDER BY u.id ASC`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// -------------------------------------------------------------
// 4. TEMPLATES (MANAJEMEN TEMPLATE SURAT)
// -------------------------------------------------------------
app.get('/api/templates', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM templates ORDER BY created_at DESC`)
    const formatted = rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      category: r.category,
      description: r.description,
      numberFormat: r.number_format,
      allowedBranches: typeof r.allowed_branches === 'string' ? JSON.parse(r.allowed_branches) : r.allowed_branches,
      isActive: Boolean(r.is_active),
      approvalSteps: typeof r.approval_steps === 'string' ? JSON.parse(r.approval_steps) : r.approval_steps,
      fields: typeof r.fields === 'string' ? JSON.parse(r.fields) : r.fields,
      letterTemplate: r.letter_template,
      defaultViewers: r.default_viewers ? (typeof r.default_viewers === 'string' ? JSON.parse(r.default_viewers) : r.default_viewers) : [],
      createdAt: r.created_at,
    }))
    res.json({ success: true, data: formatted })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/templates', async (req, res) => {
  try {
    const t = req.body
    const id = t.id || `tpl-${Date.now().toString(36)}`
    const allowed = JSON.stringify(t.allowedBranches || ['all'])
    const steps = JSON.stringify(t.approvalSteps || [])
    const fields = JSON.stringify(t.fields || [])
    const defaultViewers = JSON.stringify(t.defaultViewers || [])

    try {
      await pool.query(
        `INSERT INTO templates (id, code, name, category, description, number_format, allowed_branches, is_active, approval_steps, fields, letter_template, default_viewers)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
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
          t.category || 'Umum',
          t.description || '',
          t.numberFormat,
          allowed,
          t.isActive !== false ? 1 : 0,
          steps,
          fields,
          t.letterTemplate || '',
          defaultViewers,
        ]
      )
    } catch (insertColErr) {
      // Fallback jika default_viewers belum terbaca di skema lama
      await pool.query(
        `INSERT INTO templates (id, code, name, category, description, number_format, allowed_branches, is_active, approval_steps, fields, letter_template)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
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
          t.category || 'Umum',
          t.description || '',
          t.numberFormat,
          allowed,
          t.isActive !== false ? 1 : 0,
          steps,
          fields,
          t.letterTemplate || '',
        ]
      )
    }

    res.json({ success: true, id, message: 'Template berhasil disimpan' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// -------------------------------------------------------------
// SYSTEM SETTINGS (GLOBAL SETTINGS SEPERTI DEFAULT VIEWERS SEMUA SURAT)
// -------------------------------------------------------------
app.get('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params
    const [rows] = await pool.query(`SELECT value_data FROM system_settings WHERE key_name = ?`, [key])
    if (rows.length === 0) {
      return res.json({ success: true, data: null })
    }
    let parsed = rows[0].value_data
    try {
      parsed = JSON.parse(rows[0].value_data)
    } catch {
      // String biasa
    }
    res.json({ success: true, data: parsed })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { value } = req.body
    const stringVal = typeof value === 'string' ? value : JSON.stringify(value)

    await pool.query(
      `INSERT INTO system_settings (key_name, value_data)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value_data = VALUES(value_data), updated_at = CURRENT_TIMESTAMP`,
      [key, stringVal]
    )

    res.json({ success: true, message: `Setting ${key} berhasil disimpan ke database` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Toggle template active
app.patch('/api/templates/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query(`UPDATE templates SET is_active = NOT is_active WHERE id = ?`, [id])
    res.json({ success: true, message: 'Status template diperbarui' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Delete template (only if not used by any letters)
app.delete('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params
    // Check if used in letters
    const [letters] = await pool.query(`SELECT id FROM letters WHERE template_id = ? LIMIT 1`, [id])
    if (letters.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Template tidak dapat dihapus karena sudah pernah digunakan dalam pembuatan surat ajuan.',
      })
    }

    await pool.query(`DELETE FROM templates WHERE id = ?`, [id])
    res.json({ success: true, message: 'Template berhasil dihapus' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// -------------------------------------------------------------
// 5. LETTERS (SURAT AJUAN) & LAMPIRAN
// -------------------------------------------------------------

// Helper untuk menyimpan data base64 berkas lampiran fisik ke public/lampiran (gambar/pdf/dokumen)
const saveAttachmentFile = async (fileName, fileType, dataUrl) => {
  if (!dataUrl || !fileName) return null

  let fileBuffer
  let mimeType = fileType
  if (typeof dataUrl === 'string' && dataUrl.includes(';base64,')) {
    const parts = dataUrl.split(';base64,')
    fileBuffer = Buffer.from(parts[1], 'base64')
    const mimeMatch = parts[0].match(/data:(.+)/)
    if (mimeMatch) mimeType = mimeMatch[1]
  } else if (typeof dataUrl === 'string' && dataUrl.startsWith('/lampiran')) {
    // Sudah berupa relative URL yang tersimpan di disk
    return { url: dataUrl, fileName }
  } else {
    fileBuffer = Buffer.from(dataUrl, 'base64')
  }

  const ext = fileName.split('.').pop().toLowerCase()
  let subfolder = 'dokumen'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || (mimeType && mimeType.startsWith('image/'))) {
    subfolder = 'gambar'
  } else if (ext === 'pdf' || mimeType === 'application/pdf') {
    subfolder = 'pdf'
    // Validasi berkas PDF: pastikan bukan HTML error page
    const header = fileBuffer.slice(0, 5).toString('ascii')
    if (header.startsWith('<!doc') || header.startsWith('<html')) {
      throw new Error(`File "${fileName}" bukan berkas PDF yang valid (terdeteksi halaman web HTML). Harap upload file PDF asli.`)
    }
  }

  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const finalFileName = `${Date.now()}_${cleanName}`
  const targetDir = path.join(__dirname, 'public/lampiran', subfolder)
  ensureDir(targetDir)

  const targetPath = path.join(targetDir, finalFileName)
  await fsPromises.writeFile(targetPath, fileBuffer)

  const relativeUrl = `/lampiran/${subfolder}/${finalFileName}`
  console.log(` [Upload] Berkas disimpan: public/lampiran/${subfolder}/${finalFileName} (${fileBuffer.length} bytes)`)

  return {
    url: relativeUrl,
    fileName,
    size: fileBuffer.length,
    category: subfolder === 'gambar' ? 'image' : subfolder === 'pdf' ? 'pdf' : 'other',
    extension: ext,
  }
}

// Upload file lampiran (gambar/pdf/excel) ke public/lampiran
app.post('/api/upload-lampiran', async (req, res) => {
  try {
    const { fileName, fileType, dataUrl } = req.body
    if (!dataUrl || !fileName) {
      return res.status(400).json({ success: false, message: 'File data atau nama file tidak valid' })
    }

    const saved = await saveAttachmentFile(fileName, fileType, dataUrl)
    if (!saved) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file' })
    }

    res.json({
      success: true,
      ...saved,
    })
  } catch (err) {
    console.error(' [Upload] Gagal menyimpan lampiran:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

app.get('/api/letters', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM letters ORDER BY created_at DESC`)
    const formatted = rows.map((r) => {
      const fVals = typeof r.field_values === 'string' ? JSON.parse(r.field_values) : r.field_values || {}
      const rawAtts = r.attachments
        ? (typeof r.attachments === 'string' ? JSON.parse(r.attachments) : r.attachments)
        : (fVals.attachments || [])
      const atts = (Array.isArray(rawAtts) ? rawAtts : []).map((a) => {
        const url = a.url || (typeof a.dataUrl === 'string' && (a.dataUrl.startsWith('/lampiran') || a.dataUrl.startsWith('http')) ? a.dataUrl : '')
        return {
          ...a,
          url,
          dataUrl: a.dataUrl || url || '',
        }
      })
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
        title: r.title,
        fieldValues: {
          ...fVals,
          attachments: atts,
        },
        attachments: atts,
        includeKnownBy: fVals.includeKnownBy !== undefined ? Boolean(fVals.includeKnownBy) : (r.branch_id !== 'PST'),
        knownByName: fVals.knownByName || null,
        knownByPosition: fVals.knownByPosition || null,
        knownByApproved: Boolean(fVals.knownByApproved || fVals.knownByStatus === 'approved'),
        knownByStatus: fVals.knownByStatus || null,
        knownByApprovedAt: fVals.knownByApprovedAt || null,
        knownByApprovedBy: fVals.knownByApprovedBy || null,
        knownByNotes: fVals.knownByNotes || null,
        allowedViewers: Array.isArray(fVals.allowedViewers) ? fVals.allowedViewers : [],
        sharedWith: r.shared_with
          ? (typeof r.shared_with === 'string' ? JSON.parse(r.shared_with) : r.shared_with)
          : (Array.isArray(fVals.sharedWith) ? fVals.sharedWith : []),
        content: r.content,
        approvalHistory: typeof r.approval_history === 'string' ? JSON.parse(r.approval_history) : r.approval_history,
        comments: r.comments ? (typeof r.comments === 'string' ? JSON.parse(r.comments) : r.comments) : [],
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    })
    res.json({ success: true, data: formatted })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Bagikan akses surat ke user lain (Share Letter)
app.post('/api/letters/:id/share', async (req, res) => {
  try {
    const { id } = req.params
    const { sharedWith } = req.body
    const cleanSharedWith = Array.isArray(sharedWith) ? sharedWith : []

    const [rows] = await pool.query(`SELECT id, field_values FROM letters WHERE id = ?`, [id])
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' })

    const fVals = typeof rows[0].field_values === 'string' ? JSON.parse(rows[0].field_values) : rows[0].field_values || {}
    fVals.sharedWith = cleanSharedWith

    try {
      await pool.query(
        `UPDATE letters SET shared_with = ?, field_values = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(cleanSharedWith), JSON.stringify(fVals), id]
      )
    } catch (colErr) {
      await pool.query(
        `UPDATE letters SET field_values = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(fVals), id]
      )
    }

    res.json({ success: true, message: 'Akses surat berhasil dibagikan', sharedWith: cleanSharedWith })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Ambil komentar / chat surat
app.get('/api/letters/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(`SELECT comments FROM letters WHERE id = ?`, [id])
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' })
    const comments = rows[0].comments
      ? (typeof rows[0].comments === 'string' ? JSON.parse(rows[0].comments) : rows[0].comments)
      : []
    res.json({ success: true, data: comments })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Kirim komentar / chat baru ke surat
app.post('/api/letters/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const newComment = req.body

    const [rows] = await pool.query(`SELECT comments FROM letters WHERE id = ?`, [id])
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' })

    const existing = rows[0].comments
      ? (typeof rows[0].comments === 'string' ? JSON.parse(rows[0].comments) : rows[0].comments)
      : []

    const updated = [...existing, newComment]
    try {
      await pool.query(`UPDATE letters SET comments = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
        JSON.stringify(updated),
        id,
      ])
    } catch (colErr) {
      // Jika kolom comments belum ada, tambahkan kolom lalu coba lagi
      await pool.query(`ALTER TABLE letters ADD COLUMN comments JSON NULL`)
      await pool.query(`UPDATE letters SET comments = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
        JSON.stringify(updated),
        id,
      ])
    }

    res.json({ success: true, data: newComment, comments: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Simpan surat (Draf atau Submit)
app.post('/api/letters', async (req, res) => {
  try {
    const l = req.body
    const id = l.id || `ltr-${Date.now().toString(36)}`
    const rawAttachments = l.attachments || (l.fieldValues && l.fieldValues.attachments) || []
    const cleanAttachments = await Promise.all(
      (Array.isArray(rawAttachments) ? rawAttachments : []).map(async (a) => {
        let finalUrl = a.url || (typeof a.dataUrl === 'string' && (a.dataUrl.startsWith('/lampiran') || a.dataUrl.startsWith('http')) ? a.dataUrl : '')
        let finalDataUrl = a.dataUrl || a.url || ''

        // Jika dataUrl berupa base64 murni dan belum punya file fisik di disk, simpan otomatis
        if ((!finalUrl || !finalUrl.startsWith('/lampiran')) && typeof finalDataUrl === 'string' && finalDataUrl.startsWith('data:')) {
          try {
            const saved = await saveAttachmentFile(a.name || 'lampiran', a.type, finalDataUrl)
            if (saved && saved.url) {
              finalUrl = saved.url
              finalDataUrl = saved.url
            }
          } catch (e) {
            console.warn('Auto-save base64 attachment to disk warning:', e.message)
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
        }
      })
    )

    const fieldValuesObj = {
      ...(l.fieldValues || {}),
      attachments: cleanAttachments,
      allowedViewers: Array.isArray(l.allowedViewers) ? l.allowedViewers : (l.fieldValues?.allowedViewers || []),
      sharedWith: Array.isArray(l.sharedWith) ? l.sharedWith : (l.fieldValues?.sharedWith || []),
    }
    const fieldValues = JSON.stringify(fieldValuesObj)
    const approvalHistory = JSON.stringify(l.approvalHistory || [])
    const attachmentsJson = JSON.stringify(cleanAttachments)

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
          l.status || 'draft',
          l.currentStep || 1,
          l.totalSteps || 1,
          l.title,
          fieldValues,
          l.content || '',
          approvalHistory,
          attachmentsJson,
        ]
      )
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
          l.status || 'draft',
          l.currentStep || 1,
          l.totalSteps || 1,
          l.title,
          fieldValues,
          l.content || '',
          approvalHistory,
        ]
      )
    }

    res.json({ success: true, id, message: 'Surat berhasil disimpan' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Eksekusi Persetujuan (Approve / Revisi / Tolak)
app.post('/api/letters/:id/decision', async (req, res) => {
  try {
    const { id } = req.params
    const { action, notes, userName, kodeJabatan, isKnownBy } = req.body // action: 'approve' | 'revision' | 'reject'

    const [rows] = await pool.query(`SELECT * FROM letters WHERE id = ?`, [id])
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' })

    const letter = rows[0]
    const history = typeof letter.approval_history === 'string' ? JSON.parse(letter.approval_history) : letter.approval_history
    const fieldValues = typeof letter.field_values === 'string' ? JSON.parse(letter.field_values) : (letter.field_values || {})
    const now = new Date().toISOString()

    const isMengetahuiTurn = Boolean(
      isKnownBy ||
      (fieldValues.includeKnownBy && !fieldValues.knownByApproved && (letter.status === 'pending' || action === 'revision' || action === 'reject'))
    )

    if (isMengetahuiTurn) {
      // AKSI DARI PIHAK MENGETAHUI: JANGAN RE-PLACE APPROVAL HISTORY (PAK JEMMY)!
      const updatedFieldValues = {
        ...fieldValues,
        knownByStatus: action === 'approve' ? 'approved' : action === 'revision' ? 'revision' : 'rejected',
        knownByApproved: action === 'approve',
        knownByNotes: notes || (action === 'approve' ? 'Disetujui pihak mengetahui' : 'Perlu revisi pihak mengetahui'),
        knownByApprovedAt: now,
        knownByApprovedBy: userName,
      }

      let nextStatus = letter.status
      if (action === 'approve') {
        nextStatus = 'pending' // Tetap pending karena lanjut ke Step 1 (Pak Jemmy)
      } else if (action === 'revision') {
        nextStatus = 'revision'
      } else if (action === 'reject') {
        nextStatus = 'rejected'
      }

      await pool.query(
        `UPDATE letters
         SET status = ?, field_values = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [nextStatus, JSON.stringify(updatedFieldValues), id]
      )

      return res.json({ success: true, message: 'Keputusan pihak mengetahui berhasil disimpan' })
    }

    // KASUS BIASA: PEJABAT PENYETUJU (STEP APPROVAL)
    const stepIdx = letter.current_step - 1

    if (history[stepIdx]) {
      history[stepIdx].approverName = userName
      history[stepIdx].status = action === 'approve' ? 'approved' : action === 'revision' ? 'revision' : 'rejected'
      history[stepIdx].notes = notes || ''
      history[stepIdx].date = now
    }

    let nextStep = letter.current_step
    let nextStatus = letter.status

    if (action === 'approve') {
      if (letter.current_step >= letter.total_steps) {
        nextStatus = 'approved'
      } else {
        nextStep = letter.current_step + 1
        nextStatus = 'pending'
      }
    } else if (action === 'revision') {
      nextStatus = 'revision'
    } else if (action === 'reject') {
      nextStatus = 'rejected'
    }

    await pool.query(
      `UPDATE letters
       SET status = ?, current_step = ?, approval_history = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextStatus, nextStep, JSON.stringify(history), id]
    )

    // Audit Log
    const auditId = `aud-${Date.now().toString(36)}`
    await pool.query(
      `INSERT INTO audit_logs (id, letter_id, user_name, action, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [auditId, id, userName, `Keputusan: ${action.toUpperCase()}`, notes || '']
    )

    res.json({ success: true, message: `Surat berhasil di-${action}` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Hapus surat (Hanya jika masih berstatus draft)
app.delete('/api/letters/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(`SELECT id, status, letter_number FROM letters WHERE id = ?`, [id])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' })
    }

    const letter = rows[0]
    if (letter.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Hanya surat berstatus Draf yang dapat dihapus.',
      })
    }

    await pool.query(`DELETE FROM letters WHERE id = ?`, [id])
    await pool.query(`DELETE FROM audit_logs WHERE letter_id = ?`, [id])

    res.json({ success: true, message: `Draf surat ${letter.letter_number || id} berhasil dihapus` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// -------------------------------------------------------------
// 6. NOTIFIKASI & AUDIT LOGS
// -------------------------------------------------------------
app.get('/api/notifications', async (req, res) => {
  try {
    const { user_id } = req.query
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [user_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.get('/api/audit_logs/:letter_id', async (req, res) => {
  try {
    const { letter_id } = req.params
    const [rows] = await pool.query(
      `SELECT * FROM audit_logs WHERE letter_id = ? ORDER BY timestamp DESC`,
      [letter_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Serve production static frontend if built
const distPath = path.join(__dirname, 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/lampiran')) {
      return res.sendFile(path.join(distPath, 'index.html'))
    }
    next()
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [API Server] Running on http://localhost:${PORT}`)
})


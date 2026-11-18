// Utility to export letter lists to Excel (.xlsx) using dynamically loaded SheetJS
import { formatDateId, formatDateTimeId } from '../services/storage'
import { notify } from './alert'

let xlsxPromise = null
export const loadSheetJs = () => {
  if (window.XLSX) return Promise.resolve(window.XLSX)
  if (xlsxPromise) return xlsxPromise

  xlsxPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sheetjs="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.XLSX))
      existing.addEventListener('error', () => reject(new Error('Gagal memuat pustaka Excel')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
    script.async = true
    script.setAttribute('data-sheetjs', 'true')
    script.onload = () => resolve(window.XLSX)
    script.onerror = () => reject(new Error('Gagal memuat pustaka SheetJS dari CDN'))
    document.head.appendChild(script)
  })

  return xlsxPromise
}

export const exportLettersToExcel = async (letters = [], filterInfo = {}) => {
  if (!letters || letters.length === 0) {
    notify.warning('Data Kosong', 'Tidak ada data surat untuk diekspor ke Excel.')
    return
  }

  try {
    notify.info('Memproses Ekspor...', 'Sedang menyusun file Excel...')
    const XLSX = await loadSheetJs()

    const rows = letters.map((ltr, idx) => {
      // Hitung total nominal biaya jika ada
      let totalBiaya = 0
      const rincian = ltr.fieldValues?.rincian_biaya
      if (Array.isArray(rincian)) {
        rincian.forEach((item) => {
          totalBiaya += Number(item.amount) || 0
        })
      }

      // Ambil riwayat approval
      const history = Array.isArray(ltr.approvalHistory) ? ltr.approvalHistory : []
      const step1 = history[0]
      const step2 = history[1]
      const step3 = history[2]

      const formatStep = (step) => {
        if (!step) return '-'
        const name = step.approverName || step.specificUserName || step.approverRole || 'Pejabat'
        const status = step.status === 'approved' ? '✓ Disetujui' : step.status === 'rejected' ? '✗ Ditolak' : step.status === 'revision' ? '⚠ Revisi' : 'Menunggu'
        return `${name} (${status})`
      }

      // Format status
      const statusLabel =
        ltr.status === 'approved'
          ? 'DISETUJUI'
          : ltr.status === 'pending'
          ? `PENDING (Tahap ${ltr.currentStep || 1}/${ltr.totalSteps || 1})`
          : ltr.status === 'revision'
          ? 'REVISI'
          : ltr.status === 'rejected'
          ? 'DITOLAK'
          : 'DRAF'

      return {
        'No': idx + 1,
        'Nomor Surat': ltr.letterNumber || '-',
        'Tanggal Diajukan': formatDateId(ltr.createdAt || ltr.submittedAt),
        'Cabang': ltr.branchName || ltr.branchId || '-',
        'Pemohon': ltr.userName || ltr.creatorName || '-',
        'Kategori': ltr.category || ltr.templateCategory || 'Umum',
        'Jenis Template': ltr.templateName || '-',
        'Perihal / Judul Surat': ltr.title ? String(ltr.title).toUpperCase() : '-',
        'Status Surat': statusLabel,
        'Tahap Approval': `${ltr.currentStep || 1} dari ${ltr.totalSteps || 1}`,
        'Mengetahui': ltr.fieldValues?.knownByName || ltr.knownByName || '-',
        'Status Mengetahui': (ltr.fieldValues?.knownByApproved || ltr.knownByApproved || ltr.status === 'approved') ? 'Disetujui' : (ltr.fieldValues?.knownByStatus || ltr.knownByStatus || 'Menunggu'),
        'Approver 1': formatStep(step1),
        'Approver 2': formatStep(step2),
        'Approver 3': formatStep(step3),
        'Total Estimasi Biaya (Rp)': totalBiaya > 0 ? totalBiaya : '-',
        'Terakhir Diperbarui': formatDateTimeId(ltr.updatedAt || ltr.createdAt),
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)

    // Auto-fit column widths
    const colKeys = Object.keys(rows[0] || {})
    worksheet['!cols'] = colKeys.map((key) => {
      let maxLen = key.length
      rows.forEach((r) => {
        const val = r[key] ? String(r[key]) : ''
        if (val.length > maxLen) maxLen = val.length
      })
      return { wch: Math.min(Math.max(maxLen + 3, 10), 45) }
    })

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Rekap Surat')

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fileName = `Rekap_Surat_Ajuan_MP_${dateStr}.xlsx`

    XLSX.writeFile(workbook, fileName)
    notify.success('Ekspor Selesai', `File "${fileName}" berhasil diunduh.`)
  } catch (err) {
    console.error('Ekspor Excel error:', err)
    notify.error('Gagal Ekspor Excel', err.message || 'Terjadi kesalahan saat mengekspor file.')
  }
}


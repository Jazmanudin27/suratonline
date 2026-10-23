import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'

// Set worker source locally from Vite bundle (no external CDN to avoid adblocker ERR_BLOCKED_BY_CLIENT)
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
  } catch (e) {
    console.warn('Failed to assign pdfWorker:', e)
  }
}

/**
 * Render all pages of a PDF into high-res images (A4 friendly)
 * @param {string|ArrayBuffer|Uint8Array} pdfSource Base64 dataUrl, binary URL, or ArrayBuffer
 * @param {number} scale Rendering scale (1.6 gives crisp 200dpi output with fast processing)
 * @returns {Promise<Array<{ pageNumber: number, totalPages: number, dataUrl: string, width: number, height: number }>>}
 */
export async function renderPdfToPages(pdfSource, scale = 1.6) {
  if (!pdfSource) return []

  try {
    let sourceParam = null

    if (pdfSource instanceof Uint8Array) {
      sourceParam = { data: pdfSource }
    } else if (pdfSource instanceof ArrayBuffer) {
      sourceParam = { data: new Uint8Array(pdfSource) }
    } else if (typeof pdfSource === 'string' && pdfSource.startsWith('data:')) {
      // Decode Base64 dataUrl safely
      const base64Data = pdfSource.includes(';base64,')
        ? pdfSource.split(';base64,')[1]
        : pdfSource
      const cleanBase64 = base64Data.trim().replace(/\s+/g, '')
      const binaryString = window.atob(cleanBase64)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      sourceParam = { data: bytes }
    } else if (typeof pdfSource === 'string') {
      // Fetch URL or binary path
      try {
        let fetchUrl = pdfSource
        let resp = await fetch(fetchUrl)
        if (!resp.ok && fetchUrl.startsWith('/lampiran/')) {
          // Fallback coba lewat /api/lampiran
          fetchUrl = `/api${fetchUrl}`
          resp = await fetch(fetchUrl)
        }
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer()
          sourceParam = { data: new Uint8Array(arrayBuffer) }
        } else {
          sourceParam = { url: pdfSource }
        }
      } catch {
        sourceParam = { url: pdfSource }
      }
    }

    if (!sourceParam) {
      throw new Error('Format sumber dokumen PDF tidak dapat diproses')
    }

    // Hindari request ke cdnjs/jsdelivr yang kerap diblokir oleh adblocker (ERR_BLOCKED_BY_CLIENT)
    const taskConfig = {
      ...sourceParam,
    }

    let pdfDoc = null
    const timeoutMs = 25000
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Waktu muat dokumen PDF habis (timeout)')),
        timeoutMs
      )
    )

    try {
      const loadingTask = pdfjsLib.getDocument(taskConfig)
      pdfDoc = await Promise.race([loadingTask.promise, timeoutPromise])
    } catch (workerErr) {
      console.warn('PDF.js worker load failed, trying with disableWorker fallback:', workerErr.message)
      // Fallback tanpa web worker (main thread)
      const fallbackTask = pdfjsLib.getDocument({
        ...taskConfig,
        disableWorker: true,
      })
      pdfDoc = await Promise.race([fallbackTask.promise, timeoutPromise])
    }

    if (!pdfDoc) {
      throw new Error('Gagal membuka dokumen PDF')
    }

    const numPages = pdfDoc.numPages
    const renderedPages = []

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)
      const context = canvas.getContext('2d', { alpha: false })

      // White solid background to prevent transparency / dark artifacts
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise

      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95)

      renderedPages.push({
        pageNumber: pageNum,
        totalPages: numPages,
        dataUrl: imgDataUrl,
        width: viewport.width,
        height: viewport.height,
        aspectRatio: viewport.width / (viewport.height || 1),
      })

      // Clean up canvas
      canvas.width = 0
      canvas.height = 0
    }

    return renderedPages
  } catch (err) {
    console.error('Error rendering PDF pages with pdfjs:', err)
    throw err
  }
}

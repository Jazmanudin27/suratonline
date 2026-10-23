import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'

// Set worker source with robust fallback
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      pdfWorker ||
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
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
        const resp = await fetch(pdfSource)
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer()
          sourceParam = { data: new Uint8Array(arrayBuffer) }
        } else {
          // If fetch fails, pass URL directly to pdfjsLib
          sourceParam = { url: pdfSource }
        }
      } catch {
        sourceParam = { url: pdfSource }
      }
    }

    if (!sourceParam) {
      throw new Error('Format sumber dokumen PDF tidak dapat diproses')
    }

    // Configure cMap for custom fonts
    const taskConfig = {
      ...sourceParam,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
      standardFontDataUrl:
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
    }

    const loadingTask = pdfjsLib.getDocument(taskConfig)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Waktu muat dokumen PDF habis (timeout 25 detik)')),
        25000
      )
    )

    const pdfDoc = await Promise.race([loadingTask.promise, timeoutPromise])
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

      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.92)

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


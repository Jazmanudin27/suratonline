import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'

// Set worker source to local Vite bundled asset URL
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
}

/**
 * Render all pages of a PDF into high-res images (A4 friendly)
 * @param {string|ArrayBuffer} pdfSource Base64 dataUrl or binary URL
 * @param {number} scale Rendering scale (2.0 gives crisp 300dpi-like output)
 * @returns {Promise<Array<{ pageNumber: number, totalPages: number, dataUrl: string, width: number, height: number }>>}
 */
export async function renderPdfToPages(pdfSource, scale = 2.0) {
  if (!pdfSource) return []

  try {
    let sourceParam = pdfSource

    if (pdfSource instanceof Uint8Array || pdfSource instanceof ArrayBuffer) {
      sourceParam = { data: pdfSource }
    } else if (typeof pdfSource === 'string' && !pdfSource.startsWith('data:')) {
      const resp = await fetch(pdfSource)
      if (!resp.ok) throw new Error(`HTTP error ${resp.status}`)
      const arrayBuffer = await resp.arrayBuffer()
      const header = new Uint8Array(arrayBuffer.slice(0, 5))
      const headerStr = String.fromCharCode(...header)
      if (headerStr !== '%PDF-') {
        throw new Error(`File bukan PDF valid (header: ${headerStr})`)
      }
      sourceParam = { data: new Uint8Array(arrayBuffer) }
    } else if (typeof pdfSource === 'string' && pdfSource.startsWith('data:')) {
      const base64Data = pdfSource.includes(';base64,') ? pdfSource.split(';base64,')[1] : pdfSource
      const cleanBase64 = base64Data.trim().replace(/\s+/g, '')
      const binaryString = window.atob(cleanBase64)
      if (!binaryString.startsWith('%PDF-')) {
        throw new Error('Data bukan PDF valid')
      }
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      sourceParam = { data: bytes }
    }

    const loadingTask = pdfjsLib.getDocument(sourceParam)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Waktu render PDF habis (timeout 15 detik)')), 15000)
    )
    const pdfDoc = await Promise.race([loadingTask.promise, timeoutPromise])
    const numPages = pdfDoc.numPages
    const renderedPages = []

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const context = canvas.getContext('2d', { alpha: false })

      // White background
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
        aspectRatio: viewport.width / viewport.height,
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

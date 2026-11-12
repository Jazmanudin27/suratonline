import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  Car,
  Navigation,
  Clock,
  Gauge,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Fuel,
  Printer,
  FileDown,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react'

// Sample dataset accurately extracted from user's Tracksolid export
const SAMPLE_GPS_DATA = {
  importedAt: new Date().toISOString(),
  fileName: 'Trips(Detail)_2026112081457_W5Boh95g.xls (Data Contoh)',
  period: '2026-10-06 00:00:00 ~ 2026-11-09 10:39:50',
  fleetSummary: [
    {
      no: 1,
      deviceName: 'Z 8273 KL - MLG',
      imei: '864993060050573',
      model: 'JC261',
      duration: '118:19:30',
      totalMileage: 1625.04,
      fuelConsumption: 'N/A',
      fuelPer100Km: 'N/A',
      avgSpeed: 13.73,
      maxSpeed: 104.0,
    },
    {
      no: 2,
      deviceName: 'Z 8281 KL - TSM',
      imei: '860112070456068',
      model: 'JC181',
      duration: '335:16:52',
      totalMileage: 1937.46,
      fuelConsumption: 'N/A',
      fuelPer100Km: 'N/A',
      avgSpeed: 5.78,
      maxSpeed: 77.0,
    },
  ],
  vehicles: {
    'Z 8273 KL - MLG': [
      {
        date: '2026-11-09',
        startTime: '05:48:52',
        startLocation: 'Toko Plastik Rejo Agung, Jalan Arjowinangun, Perumahan New Puri Kartika Asri, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        endTime: '06:46:47',
        endLocation: 'Melati, Sumerpucung, Kabupaten Malang, East Java, Java, 65165, Indonesia',
        mileage: 27.06,
        travelTime: '00:57:54',
        avgSpeed: 28.04,
        maxSpeed: 79.0,
      },
      {
        date: '2026-11-09',
        startTime: '06:50:32',
        startLocation: 'Melati, Sumerpucung, Kabupaten Malang, East Java, Java, 65165, Indonesia',
        endTime: '09:17:08',
        endLocation: 'Pasar Ngemplak, Jalan Fatahillah, Tulungagung, East Java, Java, 66211, Indonesia',
        mileage: 79.79,
        travelTime: '02:26:35',
        avgSpeed: 32.66,
        maxSpeed: 67.0,
      },
      {
        date: '2026-11-07',
        startTime: '07:21:50',
        startLocation: 'Jalan Wonore Jo Indah, Perumahan Emerald Garden Bumiayu, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        endTime: '07:24:03',
        endLocation: 'Jalan Wonore Jo Indah, Perumahan Emerald Garden Bumiayu, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        mileage: 0.02,
        travelTime: '00:02:12',
        avgSpeed: 0.66,
        maxSpeed: 0.0,
      },
      {
        date: '2026-11-07',
        startTime: '08:21:11',
        startLocation: 'Jalan Wonore Jo Indah, Perumahan Emerald Garden Bumiayu, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        endTime: '08:45:19',
        endLocation: 'Demangjaya, Lumbangsari, Kabupaten Malang, East Java, Java, 65172, Indonesia',
        mileage: 8.23,
        travelTime: '00:24:08',
        avgSpeed: 20.46,
        maxSpeed: 60.0,
      },
      {
        date: '2026-11-07',
        startTime: '09:03:06',
        startLocation: 'Demangjaya, Lumbangsari, Kabupaten Malang, East Java, Java, 65172, Indonesia',
        endTime: '09:08:02',
        endLocation: 'Pasar Bululawang, Jalan Bululawang _ Wajak, Lumbang, Bululawang, Kabupaten Malang, East Java, Java, 65172, Indonesia',
        mileage: 1.63,
        travelTime: '00:04:55',
        avgSpeed: 19.89,
        maxSpeed: 52.0,
      },
      {
        date: '2026-11-07',
        startTime: '10:34:23',
        startLocation: 'Pasar Bululawang, Jalan Bululawang _ Wajak, Lumbang, Bululawang, Kabupaten Malang, East Java, Java, 65172, Indonesia',
        endTime: '15:26:06',
        endLocation: 'Toko Plastik Rejo Agung, Jalan Arjowinangun, Perumahan New Puri Kartika Asri, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        mileage: 63.06,
        travelTime: '04:51:43',
        avgSpeed: 12.97,
        maxSpeed: 70.0,
      },
      {
        date: '2026-11-06',
        startTime: '07:21:51',
        startLocation: 'Jalan Wonore Jo Indah, Perumahan Emerald Garden Bumiayu, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        endTime: '08:14:02',
        endLocation: 'RW 09 KEL. MERJOSARI KEC. LOWOKWARU KOTA MALANG, East Java, Java, 65144, Indonesia',
        mileage: 14.12,
        travelTime: '00:52:11',
        avgSpeed: 16.23,
        maxSpeed: 58.0,
      },
      {
        date: '2026-11-06',
        startTime: '09:41:53',
        startLocation: 'RW 09 KEL. MERJOSARI KEC. LOWOKWARU KOTA MALANG, East Java, Java, 65144, Indonesia',
        endTime: '10:45:10',
        endLocation: 'Jatimulyo, Malang, Kota Malang, East Java, Java, 65113, Indonesia',
        mileage: 7.45,
        travelTime: '01:03:17',
        avgSpeed: 7.06,
        maxSpeed: 45.0,
      },
      {
        date: '2026-11-06',
        startTime: '11:03:59',
        startLocation: 'Jatimulyo, Malang, Kota Malang, East Java, Java, 65113, Indonesia',
        endTime: '11:45:12',
        endLocation: 'Jalan Bungur, Samaan, Kelurahan Lowokwaru, Kota Malang, East Java, Java, 65123, Indonesia',
        mileage: 5.12,
        travelTime: '00:41:13',
        avgSpeed: 7.44,
        maxSpeed: 48.0,
      },
      {
        date: '2026-11-06',
        startTime: '12:26:24',
        startLocation: 'Jalan Bungur, Samaan, Kelurahan Lowokwaru, Kota Malang, East Java, Java, 65123, Indonesia',
        endTime: '12:47:32',
        endLocation: 'SMAN 7 Malang, 14, Jalan Cengger Ayam 1, Tulusrejo, Malang, Kota Malang, East Java, Java, 65141, Indonesia',
        mileage: 3.20,
        travelTime: '00:21:08',
        avgSpeed: 9.08,
        maxSpeed: 51.0,
      },
      {
        date: '2026-11-06',
        startTime: '12:58:13',
        startLocation: 'SMAN 7 Malang, 14, Jalan Cengger Ayam 1, Tulusrejo, Malang, Kota Malang, East Java, Java, 65141, Indonesia',
        endTime: '16:04:09',
        endLocation: 'Jalan Wonore Jo Indah, Perumahan Emerald Garden Bumiayu, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        mileage: 18.38,
        travelTime: '03:05:55',
        avgSpeed: 5.93,
        maxSpeed: 55.0,
      },
      {
        date: '2026-11-06',
        startTime: '16:37:16',
        startLocation: 'Jalan Wonore Jo Indah, Perumahan Emerald Garden Bumiayu, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        endTime: '16:37:38',
        endLocation: 'Jalan Wonore Jo Indah, Perumahan Emerald Garden Bumiayu, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        mileage: 0.03,
        travelTime: '00:00:22',
        avgSpeed: 4.42,
        maxSpeed: 0.0,
      },
      {
        date: '2026-11-06',
        startTime: '16:47:42',
        startLocation: 'Jalan Wonore Jo Indah, Perumahan Emerald Garden Bumiayu, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        endTime: '16:48:17',
        endLocation: 'Jalan Wonore Jo Indah, Perumahan Emerald Garden Bumiayu, Arjowinangun, Malang, Kota Malang, East Java, Java, 65132, Indonesia',
        mileage: 0.05,
        travelTime: '00:00:35',
        avgSpeed: 4.79,
        maxSpeed: 7.0,
      },
    ],
    'Z 8281 KL - TSM': [
      {
        date: '2026-11-08',
        startTime: '08:15:00',
        startLocation: 'Kantor Cabang Tasikmalaya, Jl. H.Z. Mustofa No. 120, Tasikmalaya, Jawa Barat',
        endTime: '09:45:10',
        endLocation: 'Gudang Distribusi Singaparna, Tasikmalaya, Jawa Barat',
        mileage: 24.50,
        travelTime: '01:30:10',
        avgSpeed: 16.33,
        maxSpeed: 64.0,
      },
      {
        date: '2026-11-08',
        startTime: '10:30:20',
        startLocation: 'Gudang Distribusi Singaparna, Tasikmalaya, Jawa Barat',
        endTime: '12:15:40',
        endLocation: 'Toko Mitra Mandiri, Ciawi, Tasikmalaya, Jawa Barat',
        mileage: 38.10,
        travelTime: '01:45:20',
        avgSpeed: 21.68,
        maxSpeed: 77.0,
      },
    ],
  },
}

// Helper time difference in seconds
function getTimeDifferenceSeconds(date1Str, time1Str, date2Str, time2Str) {
  try {
    const d1 = new Date(`${date1Str}T${time1Str}`)
    const d2 = new Date(`${date2Str}T${time2Str}`)
    const diffMs = d2.getTime() - d1.getTime()
    return Math.max(0, Math.floor(diffMs / 1000))
  } catch {
    return 0
  }
}

// Format seconds into readable Indonesian string
function formatDurationFromSeconds(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0 menit'
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  const parts = []
  if (days > 0) parts.push(`${days} hari`)
  if (hours > 0) parts.push(`${hours} jam`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} mnt`)
  return parts.join(' ')
}

export default function GpsTracker({ onBack }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('suratajuan_gps_data')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn('Load GPS data error:', e)
    }
    return SAMPLE_GPS_DATA
  })

  const [selectedVehicle, setSelectedVehicle] = useState('ALL')
  const [selectedDate, setSelectedDate] = useState('ALL')
  const [speedFilter, setSpeedFilter] = useState('ALL') // 'ALL' | 'OVER_80' | 'OVER_100'
  const [searchLocation, setSearchLocation] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const fileInputRef = useRef(null)

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (data) {
      try {
        localStorage.setItem('suratajuan_gps_data', JSON.stringify(data))
      } catch (e) {
        console.warn('Save GPS data to localStorage error:', e)
      }
    }
  }, [data])

  // Dynamically load SheetJS if not already present
  const loadSheetJS = () => {
    return new Promise((resolve, reject) => {
      if (window.XLSX) {
        return resolve(window.XLSX)
      }
      const script = document.createElement('script')
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
      script.async = true
      script.onload = () => {
        if (window.XLSX) resolve(window.XLSX)
        else reject(new Error('SheetJS script loaded but XLSX not found'))
      }
      script.onerror = () => {
        // Fallback to cdnjs
        const fallbackScript = document.createElement('script')
        fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
        fallbackScript.async = true
        fallbackScript.onload = () => resolve(window.XLSX)
        fallbackScript.onerror = () => reject(new Error('Gagal memuat library pembaca Excel'))
        document.head.appendChild(fallbackScript)
      }
      document.head.appendChild(script)
    })
  }

  // Handle Excel File Upload & Multi-sheet Parsing
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setParseError(null)

    try {
      const XLSX = await loadSheetJS()
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      const sheetNames = workbook.SheetNames
      if (!sheetNames || sheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki sheet yang dapat dibaca.')
      }

      let fleetSummary = []
      const vehicles = {}
      let globalPeriod = ''

      // Process Sheet 1 (Trips Detail / Fleet Recap)
      const firstSheet = workbook.Sheets[sheetNames[0]]
      const firstSheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })

      if (firstSheetData.length > 0) {
        // Row 0 or 1 often contains "Trips(2026-10-06 00:00:00~2026-11-09 10:39:50)"
        for (let r = 0; r < Math.min(5, firstSheetData.length); r++) {
          const rowStr = (firstSheetData[r] || []).join(' ')
          const matchPeriod = rowStr.match(/Trips\(([^)]+)\)/i)
          if (matchPeriod) {
            globalPeriod = matchPeriod[1]
            break
          }
        }

        // Find header row in first sheet: "No.", "Device Name", "IMEI", "Model", etc.
        let headerRowIdx = -1
        for (let r = 0; r < Math.min(10, firstSheetData.length); r++) {
          const row = firstSheetData[r] || []
          if (row.some((cell) => String(cell).toLowerCase().includes('device name'))) {
            headerRowIdx = r
            break
          }
        }

        if (headerRowIdx !== -1) {
          const headers = firstSheetData[headerRowIdx].map((h) => String(h).trim().toLowerCase())
          const devIdx = headers.findIndex((h) => h.includes('device name'))
          const imeiIdx = headers.findIndex((h) => h.includes('imei'))
          const modelIdx = headers.findIndex((h) => h.includes('model'))
          const durIdx = headers.findIndex((h) => h.includes('duration'))
          const milIdx = headers.findIndex((h) => h.includes('total mileage'))
          const avgSpdIdx = headers.findIndex((h) => h.includes('average speed'))
          const maxSpdIdx = headers.findIndex((h) => h.includes('max. speed') || h.includes('max speed'))

          for (let r = headerRowIdx + 1; r < firstSheetData.length; r++) {
            const row = firstSheetData[r] || []
            const devName = String(row[devIdx] || '').trim()
            if (!devName || devName.toLowerCase() === 'total' || devName.toLowerCase().startsWith('trips')) {
              continue
            }
            fleetSummary.push({
              no: fleetSummary.length + 1,
              deviceName: devName,
              imei: String(row[imeiIdx] || ''),
              model: String(row[modelIdx] || ''),
              duration: String(row[durIdx] || ''),
              totalMileage: parseFloat(row[milIdx]) || 0,
              fuelConsumption: 'N/A',
              fuelPer100Km: 'N/A',
              avgSpeed: parseFloat(row[avgSpdIdx]) || 0,
              maxSpeed: parseFloat(row[maxSpdIdx]) || 0,
            })
          }
        }
      }

      // Process Individual Vehicle Sheets (Sheet 2..N, or all sheets)
      for (let s = 0; s < sheetNames.length; s++) {
        const sName = sheetNames[s]
        // Skip first sheet if it's the recap table and we have other vehicle sheets
        if (s === 0 && sheetNames.length > 1 && sName.toLowerCase().includes('detail')) {
          continue
        }

        // Clean vehicle name from tab name e.g. "1.Z 8273 KL - MLG" -> "Z 8273 KL - MLG"
        const cleanDevName = sName.replace(/^\d+\.\s*/, '').trim()
        const sheet = workbook.Sheets[sName]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        // Find headers: "Start time", "Start location", "End time", "End location", etc.
        let tripHeaderIdx = -1
        let colMap = {}

        for (let r = 0; r < Math.min(10, rows.length); r++) {
          const row = rows[r] || []
          const hasStart = row.some((c) => String(c).toLowerCase().includes('start time'))
          const hasLoc = row.some((c) => String(c).toLowerCase().includes('start location'))
          if (hasStart && hasLoc) {
            tripHeaderIdx = r
            row.forEach((col, idx) => {
              const lower = String(col).trim().toLowerCase()
              if (lower.includes('start time')) colMap.startTime = idx
              else if (lower.includes('start location')) colMap.startLocation = idx
              else if (lower.includes('end time')) colMap.endTime = idx
              else if (lower.includes('end location')) colMap.endLocation = idx
              else if (lower.includes('total mileage')) colMap.mileage = idx
              else if (lower.includes('travel time')) colMap.travelTime = idx
              else if (lower.includes('average speed')) colMap.avgSpeed = idx
              else if (lower.includes('max. speed') || lower.includes('max speed')) colMap.maxSpeed = idx
            })
            break
          }
        }

        if (tripHeaderIdx === -1) {
          continue // Sheet doesn't contain trip rows
        }

        const tripsForVehicle = []
        let currentDate = ''

        for (let r = tripHeaderIdx + 1; r < rows.length; r++) {
          const row = rows[r] || []
          const firstCell = String(row[0] || '').trim()

          // Check if this row is a date header (e.g. "2026-11-09" or similar)
          if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(firstCell)) {
            currentDate = firstCell.replace(/[/.]/g, '-')
            continue
          }

          // Stop or ignore on "Total" or empty rows
          if (!firstCell || firstCell.toLowerCase() === 'total' || firstCell.toLowerCase().startsWith('trips')) {
            continue
          }

          // Check if it's a valid trip row (has time format e.g. 06:50:32 or numeric)
          const startTimeVal = String(row[colMap.startTime ?? 0] || '').trim()
          const startLocVal = String(row[colMap.startLocation ?? 1] || '').trim()
          const endTimeVal = String(row[colMap.endTime ?? 2] || '').trim()
          const endLocVal = String(row[colMap.endLocation ?? 3] || '').trim()

          if (!startTimeVal || !startLocVal) continue

          const mileageVal = parseFloat(row[colMap.mileage]) || 0
          const travelTimeVal = String(row[colMap.travelTime] || '')
          const avgSpeedVal = parseFloat(row[colMap.avgSpeed]) || 0
          const maxSpeedVal = parseFloat(row[colMap.maxSpeed]) || 0

          tripsForVehicle.push({
            date: currentDate || 'Tanpa Tanggal',
            startTime: startTimeVal,
            startLocation: startLocVal,
            endTime: endTimeVal,
            endLocation: endLocVal,
            mileage: mileageVal,
            travelTime: travelTimeVal,
            avgSpeed: avgSpeedVal,
            maxSpeed: maxSpeedVal,
          })
        }

        if (tripsForVehicle.length > 0) {
          // Tracksolid exports trips within each day in REVERSE order.
          // Sort strictly in chronological order (ascending) so we can accurately measure idle/stop time between trips!
          tripsForVehicle.sort((a, b) => {
            const timeA = new Date(`${a.date}T${a.startTime}`).getTime() || 0
            const timeB = new Date(`${b.date}T${b.startTime}`).getTime() || 0
            return timeA - timeB
          })

          vehicles[cleanDevName] = tripsForVehicle

          // If fleet summary didn't catch this vehicle, add it
          if (!fleetSummary.some((f) => f.deviceName === cleanDevName)) {
            const totalMil = tripsForVehicle.reduce((acc, t) => acc + t.mileage, 0)
            const maxSpd = Math.max(...tripsForVehicle.map((t) => t.maxSpeed || 0), 0)
            fleetSummary.push({
              no: fleetSummary.length + 1,
              deviceName: cleanDevName,
              imei: '-',
              model: 'GPS Tracker',
              duration: '-',
              totalMileage: Number(totalMil.toFixed(2)),
              fuelConsumption: 'N/A',
              fuelPer100Km: 'N/A',
              avgSpeed: 0,
              maxSpeed: maxSpd,
            })
          }
        }
      }

      if (Object.keys(vehicles).length === 0) {
        throw new Error('Tidak ditemukan sheet detail perjalanan kendaraan dengan format yang sesuai.')
      }

      const parsedData = {
        importedAt: new Date().toISOString(),
        fileName: file.name,
        period: globalPeriod || 'Periode Terlampir',
        fleetSummary,
        vehicles,
      }

      setData(parsedData)
      setSelectedVehicle('ALL')
      setSelectedDate('ALL')
    } catch (err) {
      console.error('Error parsing Excel GPS:', err)
      setParseError(err.message || 'Gagal memproses file Excel.')
    } finally {
      setIsParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Available vehicles list
  const vehicleList = useMemo(() => {
    return Object.keys(data?.vehicles || {})
  }, [data])

  // Get active trips based on selected vehicle
  const activeTripsWithStops = useMemo(() => {
    if (!data?.vehicles) return []

    let targetTrips = []
    if (selectedVehicle === 'ALL') {
      // Combine all trips from all vehicles
      Object.entries(data.vehicles).forEach(([vName, trips]) => {
        trips.forEach((t) => {
          targetTrips.push({ ...t, vehicleName: vName })
        })
      })
      // Sort chronologically
      targetTrips.sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.startTime}`).getTime() || 0
        const timeB = new Date(`${b.date}T${b.startTime}`).getTime() || 0
        return timeA - timeB
      })
    } else {
      const trips = data.vehicles[selectedVehicle] || []
      targetTrips = trips.map((t) => ({ ...t, vehicleName: selectedVehicle }))
    }

    // Filter by Date
    if (selectedDate !== 'ALL') {
      targetTrips = targetTrips.filter((t) => t.date === selectedDate)
    }

    // Filter by Location Search
    if (searchLocation.trim()) {
      const term = searchLocation.toLowerCase()
      targetTrips = targetTrips.filter(
        (t) =>
          (t.startLocation || '').toLowerCase().includes(term) ||
          (t.endLocation || '').toLowerCase().includes(term)
      )
    }

    // Filter by Speed
    if (speedFilter === 'OVER_80') {
      targetTrips = targetTrips.filter((t) => (t.maxSpeed || 0) >= 80)
    } else if (speedFilter === 'OVER_100') {
      targetTrips = targetTrips.filter((t) => (t.maxSpeed || 0) >= 100)
    }

    // Calculate Stop / Idle duration before each trip (when comparing with the previous trip of the SAME vehicle)
    const tripsPerVehicleMap = {}
    const result = []

    targetTrips.forEach((trip) => {
      const v = trip.vehicleName
      const prevTrip = tripsPerVehicleMap[v]

      let stopDurationSeconds = 0
      let stopLocation = ''

      if (prevTrip) {
        stopDurationSeconds = getTimeDifferenceSeconds(
          prevTrip.date,
          prevTrip.endTime,
          trip.date,
          trip.startTime
        )
        stopLocation = prevTrip.endLocation
      }

      tripsPerVehicleMap[v] = trip

      result.push({
        ...trip,
        stopDurationSeconds,
        stopDurationFormatted: stopDurationSeconds > 0 ? formatDurationFromSeconds(stopDurationSeconds) : null,
        stopLocation,
      })
    })

    return result
  }, [data, selectedVehicle, selectedDate, searchLocation, speedFilter])

  // Available dates for filter dropdown
  const availableDates = useMemo(() => {
    const dates = new Set()
    if (!data?.vehicles) return []

    if (selectedVehicle === 'ALL') {
      Object.values(data.vehicles).forEach((trips) => {
        trips.forEach((t) => {
          if (t.date) dates.add(t.date)
        })
      })
    } else {
      const trips = data.vehicles[selectedVehicle] || []
      trips.forEach((t) => {
        if (t.date) dates.add(t.date)
      })
    }
    return Array.from(dates).sort().reverse()
  }, [data, selectedVehicle])

  // Aggregated Statistics
  const stats = useMemo(() => {
    let totalKm = 0
    let maxSpeed = 0
    let totalOver80 = 0
    let totalOver100 = 0
    let totalStopSeconds = 0

    activeTripsWithStops.forEach((t) => {
      totalKm += t.mileage || 0
      if ((t.maxSpeed || 0) > maxSpeed) maxSpeed = t.maxSpeed
      if ((t.maxSpeed || 0) >= 100) totalOver100++
      else if ((t.maxSpeed || 0) >= 80) totalOver80++
      if (t.stopDurationSeconds) totalStopSeconds += t.stopDurationSeconds
    })

    const avgSpeed =
      activeTripsWithStops.length > 0
        ? (
            activeTripsWithStops.reduce((acc, t) => acc + (t.avgSpeed || 0), 0) /
            activeTripsWithStops.length
          ).toFixed(1)
        : 0

    return {
      tripsCount: activeTripsWithStops.length,
      totalKm: totalKm.toFixed(2),
      maxSpeed,
      avgSpeed,
      totalOver80,
      totalOver100,
      totalStopDuration: formatDurationFromSeconds(totalStopSeconds),
    }
  }, [activeTripsWithStops])

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Kembali ke Aplikasi Utama"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Navigation className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Pelacak & Analisis GPS Armada
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Live Analyzer
                  </span>
                </h1>
                <p className="text-xs text-slate-300">
                  Impor & telusuri riwayat rute, kecepatan laju, dan durasi berhenti/parkir kendaraan operasional
                </p>
              </div>
            </div>

            {data?.period && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 mt-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Periode Data: <strong className="text-white">{data.period}</strong></span>
                {data.fileName && <span className="text-slate-400">({data.fileName})</span>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isParsing ? 'Membaca Excel...' : 'Unggah Excel Tracksolid (.xlsx)'}</span>
            </button>

            <button
              onClick={() => {
                setData(SAMPLE_GPS_DATA)
                setSelectedVehicle('ALL')
                setSelectedDate('ALL')
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Muat data contoh Z 8273 KL & Z 8281 KL"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Data Contoh</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Hapus data GPS yang tersimpan saat ini?')) {
                  setData(null)
                  localStorage.removeItem('suratajuan_gps_data')
                }
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/50 transition cursor-pointer"
              title="Reset Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {parseError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}
      </div>

      {/* Overview Fleet Recap Table (From Sheet 1) */}
      {data?.fleetSummary && data.fleetSummary.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Ringkasan Armada Kendaraan ({data.fleetSummary.length} Unit)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Rekapitulasi total jarak & durasi dari perangkat GPS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-y border-slate-200 text-[10px]">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Kendaraan / Plat</th>
                  <th className="py-2.5 px-3">IMEI GPS</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3 text-right">Total Jarak</th>
                  <th className="py-2.5 px-3 text-right">Durasi Bergerak</th>
                  <th className="py-2.5 px-3 text-right">Rata-rata Speed</th>
                  <th className="py-2.5 px-3 text-right">Max Speed</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.fleetSummary.map((item, idx) => {
                  const isSelected = selectedVehicle === item.deviceName
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition ${
                        isSelected ? 'bg-indigo-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-500">{item.no || idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-slate-900">{item.deviceName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{item.imei || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.model || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-black text-indigo-700">
                        {Number(item.totalMileage || 0).toLocaleString('id-ID')} km
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{item.duration || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {item.avgSpeed ? `${item.avgSpeed} km/h` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                            item.maxSpeed >= 100
                              ? 'bg-rose-100 text-rose-700'
                              : item.maxSpeed >= 80
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.maxSpeed} km/h
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedVehicle(item.deviceName)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSelected ? 'Dipilih' : 'Pilih Unit'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
            <span>Total Jarak</span>
          </div>
          <div className="text-lg font-black text-slate-900">{stats.totalKm} <span className="text-xs font-semibold text-slate-500">km</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dari {stats.tripsCount} perjalanan</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Total Parkir/Diam</span>
          </div>
          <div className="text-sm font-black text-amber-700">{stats.totalStopDuration}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Waktu jeda antar trip</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-500" />
            <span>Kecepatan Rata²</span>
          </div>
          <div className="text-lg font-black text-slate-900">{stats.avgSpeed} <span className="text-xs font-semibold text-slate-500">km/h</span></div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Konsisten normal</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>Top Speed</span>
          </div>
          <div className="text-lg font-black text-slate-900">{stats.maxSpeed} <span className="text-xs font-semibold text-slate-500">km/h</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">Rekor kecepatan tertinggi</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Ngebut (&gt;80 km/h)</span>
          </div>
          <div className="text-lg font-black text-amber-600">{stats.totalOver80} <span className="text-xs font-semibold text-slate-500">kali</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">Peringatan waspada</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Bahaya (&gt;100 km/h)</span>
          </div>
          <div className="text-lg font-black text-rose-600">{stats.totalOver100} <span className="text-xs font-semibold text-slate-500">kali</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">Potensi overspeed</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        {/* Vehicle Selection Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Car className="w-3.5 h-3.5" /> Pilih Armada:
          </span>
          <button
            onClick={() => setSelectedVehicle('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedVehicle === 'ALL'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Semua Armada ({vehicleList.length})
          </button>
          {vehicleList.map((vName) => (
            <button
              key={vName}
              onClick={() => setSelectedVehicle(vName)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedVehicle === vName
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Car className="w-3 h-3" />
              <span>{vName}</span>
              <span className="text-[10px] opacity-75">
                ({(data?.vehicles?.[vName] || []).length} trip)
              </span>
            </button>
          ))}
        </div>

        {/* Second Filter Row: Date, Speed, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Date Filter */}
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Tanggal Perjalanan:
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-indigo-500"
            >
              <option value="ALL">Semua Tanggal ({availableDates.length} Hari)</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Speed Alert Filter */}
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Filter Kecepatan:
            </label>
            <select
              value={speedFilter}
              onChange={(e) => setSpeedFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-indigo-500"
            >
              <option value="ALL">Semua Kecepatan</option>
              <option value="OVER_80">⚠️ Peringatan Laju (&ge; 80 km/h)</option>
              <option value="OVER_100">🚨 Bahaya Overspeed (&ge; 100 km/h)</option>
            </select>
          </div>

          {/* Search Location Input */}
          <div className="sm:col-span-6">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Cari Nama Lokasi / Titik Singgah:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Ketik nama jalan, pasar, cabang, kota (contoh: Tulungagung, Bululawang)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-indigo-500"
              />
              {searchLocation && (
                <button
                  onClick={() => setSearchLocation('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trips Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Kronologi Rute & Durasi Singgah ({activeTripsWithStops.length} Log)
            </h2>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak Rekap</span>
          </button>
        </div>

        {activeTripsWithStops.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
            <Navigation className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak ada log perjalanan yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">
              Coba sesuaikan filter kendaraan, tanggal, atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTripsWithStops.map((trip, idx) => {
              const isOver100 = (trip.maxSpeed || 0) >= 100
              const isOver80 = (trip.maxSpeed || 0) >= 80 && !isOver100
              const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                trip.startLocation
              )}&destination=${encodeURIComponent(trip.endLocation)}`

              return (
                <React.Fragment key={idx}>
                  {/* Indicator for Parking / Stop between consecutive trips */}
                  {trip.stopDurationSeconds > 0 && (
                    <div className="relative pl-6 pr-4 py-2 bg-amber-50/90 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs text-amber-900">
                        <span className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center font-black text-amber-800 text-[11px] shrink-0">
                          🅿️
                        </span>
                        <div>
                          <span className="font-extrabold text-amber-950">
                            Parkir / Berhenti Selama: {trip.stopDurationFormatted}
                          </span>
                          <p className="text-[11px] text-amber-800 line-clamp-1">
                            Di: {trip.stopLocation || trip.startLocation}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-700 font-semibold self-start sm:self-center bg-amber-100/80 px-2 py-0.5 rounded-md">
                        Jeda sebelum perjalanan #{idx + 1}
                      </span>
                    </div>
                  )}

                  {/* Trip Card */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/90 hover:border-indigo-300 transition-all hover:shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {trip.vehicleName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                            📅 {trip.date}
                          </span>
                        </div>
                      </div>

                      {/* Right Badges: Mileage, Time, Speed */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-100">
                          📏 {trip.mileage} km
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold">
                          ⏱ {trip.travelTime}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono">
                          Rata²: {trip.avgSpeed} km/h
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1 ${
                            isOver100
                              ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                              : isOver80
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {(isOver100 || isOver80) && <AlertTriangle className="w-3 h-3" />}
                          Max: {trip.maxSpeed} km/h
                        </span>
                      </div>
                    </div>

                    {/* Locations Grid: Departure -> Arrival */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      {/* Departure */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="text-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-bold text-slate-400 text-[10px] uppercase">Berangkat:</span>
                            <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                              {trip.startTime}
                            </span>
                          </div>
                          <p className="text-slate-800 leading-snug">{trip.startLocation}</p>
                        </div>
                      </div>

                      {/* Arrival */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Navigation className="w-4 h-4" />
                        </div>
                        <div className="text-xs flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-bold text-slate-400 text-[10px] uppercase">Tiba di Tujuan:</span>
                            <span className="font-mono font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                              {trip.endTime}
                            </span>
                          </div>
                          <p className="text-slate-800 leading-snug">{trip.endLocation}</p>
                        </div>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-center p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition shrink-0"
                          title="Buka rute di Google Maps"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


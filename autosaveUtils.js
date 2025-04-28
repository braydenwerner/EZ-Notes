import { COLORS } from './config.js'

// Compress canvas data to reduce storage size
export function compressCanvasData(data) {
  // Simplified compression algorithm - reduce precision and remove unnecessary properties
  return data.map((page) =>
    page.map((line) =>
      line.map((point) => ({
        x: Math.round(point.x), // Round
        y: Math.round(point.y), // Round
        c: point.currentColor, // Shorten property name
        t: point.thick // Shorten property name
      }))
    )
  )
}

// Decompress canvas data
export function decompressCanvasData(compressedData) {
  if (!compressedData) return []

  return compressedData.map((page) =>
    page.map((line) =>
      line.map((point) => ({
        x: point.x,
        y: point.y,
        currentColor: point.c, // Restore original property name
        thick: point.t // Restore original property name
      }))
    )
  )
}

// Get data from Cookie
export function getDataFromCookies() {
  const cookies = document.cookie.split(';').map((c) => c.trim())
  const chunkCountCookie = cookies.find((c) => c.startsWith('ez_data_chunks='))

  if (!chunkCountCookie) return null

  const chunks = parseInt(chunkCountCookie.split('=')[1])
  const dataChunks = []

  for (let i = 0; i < chunks; i++) {
    const chunkCookie = cookies.find((c) => c.startsWith(`ez_data_${i}=`))
    if (chunkCookie) {
      const chunk = decodeURIComponent(chunkCookie.split('=')[1])
      dataChunks.push(chunk)
    }
  }

  if (dataChunks.length === chunks) {
    return dataChunks.join('')
  }

  return null
}

// Save canvas data
export function saveCanvasData({
  canvas,
  pagePointStates,
  currentPageIndex,
  totalPages
}) {
  try {
    // If auto-save is disabled, do not execute save operation
    if (window.autoSaveEnabled === false) {
      return
    }

    // Save current page data to pagePointStates
    if (pagePointStates[currentPageIndex] !== canvas.getPointStateTimeline()) {
      pagePointStates[currentPageIndex] = [...canvas.getPointStateTimeline()]
    }

    // Store data as a JSON string and use simplified format to reduce size
    const compressedData = compressCanvasData(pagePointStates)
    const savedData = {
      pages: compressedData,
      currentPage: currentPageIndex,
      totalPages: totalPages,
      theme: COLORS.background
    }

    const dataString = JSON.stringify(savedData)

    let saveSuccess = false

    try {
      // Use localStorage as primary storage
      localStorage.setItem('ez-notes-data', dataString)
      saveSuccess = true
    } catch (storageError) {
      console.error('localStorage save failed:', storageError)
    }

    // If localStorage fails, try using cookie
    if (!saveSuccess) {
      try {
        // Store data in smaller chunks in multiple cookies
        const chunkSize = 4000 // Single cookie maximum size close to 4KB
        const chunks = Math.ceil(dataString.length / chunkSize)

        // Clear all existing data block cookies
        for (let i = 0; i <= 20; i++) {
          document.cookie = `ez_data_${i}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }

        // Store new data chunks
        for (let i = 0; i < chunks; i++) {
          const chunk = dataString.substring(i * chunkSize, (i + 1) * chunkSize)
          document.cookie = `ez_data_${i}=${encodeURIComponent(
            chunk
          )}; path=/; max-age=31536000`
        }

        // Store chunk count information
        document.cookie = `ez_data_chunks=${chunks}; path=/; max-age=31536000`
      } catch (cookieError) {
        console.error('Cookie save failed:', cookieError)
      }
    }
  } catch (e) {
    console.error('Save data failed:', e)
  }
}

// Load canvas data from storage
export function loadCanvasData({
  canvas,
  pagePointStates,
  currentPageIndex,
  currentPageNum,
  totalPages,
  pageNumber,
  thickness
}) {
  try {
    console.log('Attempting to load saved data...')

    // Attempt to read data from multiple storage locations
    let savedDataStr = null

    // First attempt to read from localStorage
    savedDataStr = localStorage.getItem('ez-notes-data')

    // If localStorage fails, attempt to read from cookie
    if (!savedDataStr) {
      console.log(
        'Failed to load from localStorage, attempting to load from cookie'
      )
      savedDataStr = getDataFromCookies()
    }

    // Process data (if found)
    if (savedDataStr) {
      console.log('Found saved data, length: ' + savedDataStr.length)
      const savedData = JSON.parse(savedDataStr)

      if (savedData && savedData.pages) {
        // Decompress data
        pagePointStates = decompressCanvasData(savedData.pages)
        currentPageIndex = savedData.currentPage || 0
        totalPages = savedData.totalPages || 1
        currentPageNum = currentPageIndex + 1

        if (savedData.theme) {
          COLORS.background = savedData.theme
        }

        canvas.setPointStateTimeline(pagePointStates[currentPageIndex] || [])
        pageNumber.innerText = `${currentPageNum} of ${totalPages}`
        canvas.clear()
        canvas.drawPoints({
          cPoints: canvas.getPointStateTimeline(),
          thickness,
          movedLinesMapping: []
        })
        console.log(
          'Data load successful, page count: ' + pagePointStates.length
        )
      }
    } else {
      console.log('No saved data found')
    }
  } catch (e) {
    console.error('Load data failed:', e)
  }
}

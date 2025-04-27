import { COLORS } from './config.js'
import Canvas from './canvas.js'

const toolbar = document.getElementById('toolbar')
const colorPickerButton = document.getElementById('color-picker-button')
const colorPickerContainer = document.getElementById('color-picker-container')
const redSlider = document.getElementById('red-slider')
const greenSlider = document.getElementById('green-slider')
const blueSlider = document.getElementById('blue-slider')
const colorRedValue = document.getElementById('color-red-value')
const colorGreenValue = document.getElementById('color-green-value')
const colorBlueValue = document.getElementById('color-blue-value')
const toggleTheme = document.getElementById('toggle-theme')
const customEraserCursor = document.getElementById('custom-eraser-cursor')
const penLock = document.getElementById('pen-lock')
const pageNumber = document.getElementById('page-number')
const sliderPen = document.getElementById('slider-pen')
const sliderEraser = document.getElementById('slider-eraser')

const canvas = new Canvas()
const ctx = canvas.getCtx()

// Drawing is not allowed in the toolbar area
let minX = toolbar.offsetLeft - toolbar.offsetWidth / 2
let maxX = toolbar.offsetLeft + toolbar.offsetWidth / 2
// 20 is the top margin of the toolbar
let minY = toolbar.offsetTop - toolbar.offsetHeight / 2 + 20
let maxY = toolbar.offsetTop + toolbar.offsetHeight / 2 + 20

// Color picker popup
let isPopUpHidden = true
// Set position based on screen size and toolbar
colorPickerContainer.style.width = '285px'
colorPickerContainer.style.height = '68px'
colorPickerContainer.style.left = minX + 'px'

let popUpMinX = minX
let popUpMaxX = minX + 285
let popUpMinY = 83
let popUpMaxY = 83 + 68

let currentColor = COLORS.purple
let previousButton
let thickness = sliderPen.value
let eraserThickness = sliderEraser.value
let currentPageIndex = 0
let currentPageNum = 1
let totalPages = 1

let isPenLocked = false
let usingSelectorTool = false
let usingEraser = false
let isMouseDown = false
let movingSelectedArea = false
let hasMovedSelectedArea = false

let pos = { x: 0, y: 0 }
let previousPos = { x: 0, y: 0 }
let selectorStartPoint
let selectorEndPoint
let lastSelectedPoints

// Store canvas state for undo button
let canvasPointStates = []
// Create a smaller array to add to the total canvas state array
let currentPointState = []
// Array containing canvasPointStates for each page
let pagePointStates = []
// Array of selected lines
let selectedLines = []
// Key-value array: key=index in canvasPointStates of initial position,
// value=index in canvasPointStates of new position after selection and movement
let movedLinesMapping = []

let minSelectedX, maxSelectedX, minSelectedY, maxSelectedY

// Custom dynamic eraser cursor
customEraserCursor.style.width = eraserThickness
customEraserCursor.style.height = eraserThickness

window.onresize = () => {
  canvas.setCW(window.innerWidth)
  canvas.setCH(window.innerHeight)

  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, canvas.getCW(), canvas.getCH())

  ctx.lineWidth = thickness
  minX = toolbar.offsetLeft - toolbar.offsetWidth / 2
  maxX = toolbar.offsetLeft + toolbar.offsetWidth / 2
  minY = toolbar.offsetTop - toolbar.offsetHeight / 2
  maxY = toolbar.offsetTop + toolbar.offsetHeight

  colorPickerContainer.style.left = minX + 'px'
  popUpMinX = minX
  popUpMaxX = minX + 285
  popUpMinY = 83
  popUpMaxY = 83 + 68
}

const update = () => {
  const diffx = pos.x - previousPos.x
  const diffy = pos.y - previousPos.y
  const diffsq = diffx * diffx + diffy * diffy

  if (isMouseDown && diffsq >= 16) {
    if (!usingEraser) {
      // Add points between previousPos and currentPos,
      // If user draws lines quickly, points will be far apart

      // Minimum 5 subpoints
      const numSubpoints = Math.max(5, diffsq / 2950)
      ctx.strokeStyle = currentColor
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.lineWidth = thickness
      for (let i = 1; i < numSubpoints; i++) {
        // No need to update same position
        if (
          i * (diffx / numSubpoints) === previousPos.x &&
          i * (diffy / numSubpoints === previousPos.y)
        )
          break
        currentPointState.push({
          x: previousPos.x + i * (diffx / numSubpoints),
          y: previousPos.y + i * (diffy / numSubpoints),
          currentColor,
          thick: thickness
        })
        ctx.beginPath()
        ctx.moveTo(previousPos.x + diffx / i, previousPos.y + diffy / i)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      }
    } else {
      // Search for points within eraser radius and remove them
      deletePointsInEraserRadius(pos.x, pos.y)
    }

    previousPos.x = pos.x
    previousPos.y = pos.y
  }
}

const setCustomColor = () => {
  colorRedValue.innerText = 'R: ' + redSlider.value
  colorGreenValue.innerText = 'G: ' + greenSlider.value
  colorBlueValue.innerText = 'B: ' + blueSlider.value

  COLORS.customColor = `rgb(${redSlider.value},${greenSlider.value}, ${blueSlider.value})`
  currentColor = COLORS.customColor
  colorPickerButton.style.backgroundColor = COLORS.customColor
}

colorPickerButton.addEventListener('click', () => {
  isPopUpHidden = !isPopUpHidden

  if (isPopUpHidden) colorPickerContainer.style.display = 'none'
  else colorPickerContainer.style.display = 'inherit'
})

// Don't want to draw behind the container, so can undo drawn lines
colorPickerContainer.addEventListener('click', () => {})

redSlider.addEventListener('input', () => {
  setCustomColor()
})

greenSlider.addEventListener('input', () => {
  setCustomColor()
})

blueSlider.addEventListener('input', () => {
  setCustomColor()
})

sliderPen.addEventListener('input', () => {
  thickness = sliderPen.value
  if (!usingEraser) {
    ctx.lineWidth = thickness
  }
})

sliderEraser.addEventListener('input', () => {
  eraserThickness = sliderEraser.value
  if (usingEraser) {
    ctx.lineWidth = eraserThickness
  }
  handleEraserCursorThickness()
})

const handlePreviousPage = () => {
  // Check if previous page exists
  if (currentPageIndex === 0) return

  canvas.clear()
  pagePointStates[currentPageIndex] = [...canvasPointStates]
  currentPageIndex--

  drawPoints(pagePointStates[currentPageIndex])
  canvasPointStates = pagePointStates[currentPageIndex]
  currentPageNum--
  pageNumber.innerText = `${currentPageNum} of ${totalPages}`
  saveCanvasData()
}

const handleNextPage = () => {
  canvas.clear()
  pagePointStates[currentPageIndex] = [...canvasPointStates]
  currentPageIndex++

  if (pagePointStates[currentPageIndex]) {
    drawPoints(pagePointStates[currentPageIndex])
    canvasPointStates = pagePointStates[currentPageIndex]
  } else {
    totalPages++
    canvasPointStates = []
  }
  currentPageNum++
  pageNumber.innerText = `${currentPageNum} of ${totalPages}`
  saveCanvasData()
}

const handleToggleTheme = () => {
  // Check if current background color is close to white
  const isLightTheme =
    COLORS.background.includes('255,255,255') ||
    (COLORS.background.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) &&
      parseInt(RegExp.$1) > 200 &&
      parseInt(RegExp.$2) > 200 &&
      parseInt(RegExp.$3) > 200)

  if (isLightTheme) {
    // Switch to dark theme
    toggleTheme.style.background = `url('./assets/moon.png')`
    toggleTheme.style.backgroundRepeat = 'no-repeat'
    COLORS.background = 'rgb(40,44,52)'
  } else {
    // Switch to light theme
    toggleTheme.style.background = `url('./assets/sun1.png')`
    toggleTheme.style.backgroundRepeat = 'no-repeat'
    COLORS.background = 'rgb(255,255,255)'
  }
  canvas.clear()
  drawPoints(canvasPointStates)
  saveCanvasData()
}

const handlePenLocked = () => {
  isPenLocked = !isPenLocked

  if (isPenLocked) {
    penLock.style.background = `url('./assets/padlock.png')`
    penLock.style.backgroundRepeat = 'no-repeat'
  } else {
    penLock.style.background = `url('./assets/open-padlock.png')`
    penLock.style.backgroundRepeat = 'no-repeat'
  }
}

const handleUndo = () => {
  canvasPointStates.pop()
  canvas.clear()
  drawPoints(canvasPointStates)
  saveCanvasData()
}

const handleSelector = () => {
  // Get all points between top-left and bottom-right corners
  minSelectedX = Math.min(selectorStartPoint.x, selectorEndPoint.x)
  maxSelectedX = Math.max(selectorStartPoint.x, selectorEndPoint.x)
  minSelectedY = Math.min(selectorStartPoint.y, selectorEndPoint.y)
  maxSelectedY = Math.max(selectorStartPoint.y, selectorEndPoint.y)

  // Save all points in the selected area
  let numSelectionsCount = 0
  for (let i = 0; i < canvasPointStates.length; i++) {
    for (let point of canvasPointStates[i]) {
      if (
        point.x >= minSelectedX &&
        point.x <= maxSelectedX &&
        point.y >= minSelectedY &&
        point.y <= maxSelectedY
      ) {
        // If a line contains points in the selected area, add it to selectedLines array
        // We must check if selectedLines already contains canvasPointStates[i], otherwise there will be an error
        // Where there are duplicate lines, causing selectedLines size to double with each selection
        if (
          !selectedLines.some(
            (line) =>
              JSON.stringify(line) === JSON.stringify(canvasPointStates[i])
          )
        ) {
          selectedLines.push([...canvasPointStates[i]])
        }
        movedLinesMapping.push({
          originalLine: i,
          movedLine: canvasPointStates.length + numSelectionsCount
        })
        numSelectionsCount++
        break // Currently if any pixel touches the selected area
      }
    }
  }
}

const handleEraserCursorThickness = () => {
  cursorEraserWidth = eraserThickness
  cursorEraserHeight = eraserThickness
  customEraserCursor.style.width = eraserThickness
  customEraserCursor.style.height = eraserThickness
}

// Add event listeners and background COLORS for pen color divs
document.querySelectorAll('.pen-color').forEach((colorButton) => {
  colorButton.addEventListener('click', () => {
    // When screen is locked, shouldn't be able to do anything except unlock screen
    if (isPenLocked && colorButton.id !== 'pen-lock') return

    usingEraser = false
    usingSelectorTool = false

    customEraserCursor.style.display = 'none'

    if (previousButton) {
      switch (previousButton.id) {
        case 'color-picker-button':
          previousButton.style.backgroundColor = COLORS.customColor
          break
        case 'pen-purple':
          previousButton.style.backgroundColor = COLORS.purple
          break
        case 'pen-red':
          previousButton.style.backgroundColor = COLORS.red
          break
        case 'pen-blue':
          previousButton.style.backgroundColor = COLORS.blue
          break
        case 'pen-green':
          previousButton.style.backgroundColor = COLORS.green
          break
        case 'pen-yellow':
          previousButton.style.backgroundColor = COLORS.yellow
          break
      }
    }

    switch (colorButton.id) {
      case 'color-picker-button':
        colorButton.style.backgroundColor = COLORS.customColor
        currentColor = COLORS.customColor
        break
      case 'pen-purple':
        colorButton.style.backgroundColor = COLORS.darkPurple
        currentColor = COLORS.purple
        break
      case 'pen-red':
        colorButton.style.backgroundColor = COLORS.darkRed
        currentColor = COLORS.red
        break
      case 'pen-blue':
        colorButton.style.backgroundColor = COLORS.darkBlue
        currentColor = COLORS.blue
        break
      case 'pen-green':
        colorButton.style.backgroundColor = COLORS.darkGreen
        currentColor = COLORS.green
        break
      case 'pen-yellow':
        colorButton.style.backgroundColor = COLORS.darkYellow
        currentColor = COLORS.yellow
        break
      case 'eraser':
        usingEraser = true
        customEraserCursor.style.display = 'initial'
        handleEraserCursorThickness()
        break

      case 'selector':
        usingSelectorTool = true
        break
      case 'undo':
        handleUndo()
        break
      case 'reset':
        canvasPointStates = []
        canvas.clear()
        // Clear saved data
        localStorage.removeItem('ez-notes-data')
        // Clear all data block cookies
        for (let i = 0; i <= 20; i++) {
          document.cookie = `ez_data_${i}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
        document.cookie = `ez_data_chunks=0; path=/; max-age=31536000`
        break
      case 'previous-page':
        handlePreviousPage()
        break
      case 'next-page':
        handleNextPage()
        break
      case 'toggle-theme':
        handleToggleTheme()
        break
      case 'pen-lock':
        handlePenLocked()
        break
    }
    ctx.lineWidth = colorButton.id === 'eraser' ? eraserThickness : thickness
    previousButton = colorButton
  })
})

function drawPoints(cPoints) {
  for (let i = 0; i < cPoints.length; i++) {
    if (cPoints[i].length > 0) {
      ctx.strokeStyle = cPoints[i][0].currentColor
      ctx.lineWidth = cPoints[i][0].thick
    }

    // If line is selected and moved, don't draw original line
    movedLinesMapping = []
    /*
    for (let lineMap of movedLinesMapping) {
      if (lineMap.originalLine === i) lineMoved = true
    }
    if (lineMoved) continue
    */
    for (let pointIdx = 0; pointIdx < cPoints[i].length - 1; pointIdx++) {
      // Connect two points
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cPoints[i][pointIdx].x, cPoints[i][pointIdx].y)
      ctx.lineTo(cPoints[i][pointIdx + 1].x, cPoints[i][pointIdx + 1].y)
      ctx.stroke()
    }
  }
  // drawPoints changes line width to previous point's width, must change thickness back to current point
  ctx.lineWidth = thickness
}

const deletePointsInEraserRadius = (x, y) => {
  for (let i = 0; i < canvasPointStates.length; i++) {
    for (
      let pointIdx = 0;
      pointIdx < canvasPointStates[i].length - 1;
      pointIdx++
    ) {
      // Connect two points
      const radius = eraserThickness / 2
      let xDist = canvasPointStates[i][pointIdx].x - x
      let yDist = canvasPointStates[i][pointIdx].y - y
      if (xDist * xDist + yDist * yDist <= radius * radius) {
        // If erasing in the middle, must split one line into two
        // Otherwise lines won't render correctly

        // Second line, insert new element at i+1
        canvasPointStates.splice(
          i + 1,
          0,
          [...canvasPointStates[i]].slice(
            pointIdx + 1,
            canvasPointStates[i].length
          )
        )
        // First line
        canvasPointStates[i] = canvasPointStates[i].slice(0, pointIdx)

        // Filter out lines that don't contain points
        canvasPointStates = canvasPointStates.filter((line) => line.length > 1)
        pointIdx--
      }
    }
  }
  canvas.clear()
  drawPoints(canvasPointStates)
}

window.addEventListener('mousedown', (e) => {
  if (isPenLocked) return

  const x = e.clientX
  const y = e.clientY

  if (
    (y >= minY && y <= maxY && x >= minX && x <= maxX) ||
    (!isPopUpHidden &&
      y >= popUpMinY &&
      y <= popUpMaxY &&
      x >= popUpMinX &&
      x <= popUpMaxX)
  )
    return

  if (
    !isPopUpHidden &&
    !(y >= popUpMinY && y <= popUpMaxY && x >= popUpMinX && x <= popUpMaxX)
  ) {
    isPopUpHidden = true
    colorPickerContainer.style.display = 'none'
  }

  // Remove selector outline
  if (selectorStartPoint) {
    canvas.clear()
    drawPoints(canvasPointStates)
  }

  isMouseDown = true

  if (!usingSelectorTool) {
    currentPointState = []
    if (previousPos.x !== x && previousPos.y !== y) {
      if (usingEraser) {
        // Search for points within eraser radius and delete them
        deletePointsInEraserRadius(x, y)
      } else {
        currentPointState.push({
          x: pos.x,
          y: pos.y,
          currentColor,
          thick: thickness
        })
      }
    }

    // If wallpaper is on multiple displays, mouse coordinates may be out of bounds
    if (x < 1 || x >= canvas.getCW() - 1) return
    if (usingEraser) return

    previousPos.x = x
    previousPos.y = y

    // Draw single point
    ctx.strokeStyle = currentColor
    ctx.beginPath()
    ctx.moveTo(x - 1, y - 1)
    ctx.lineTo(x + 1, y + 1)
    currentPointState.push({
      x: x - 1,
      y: y - 1,
      currentColor,
      thick: thickness
    })
    ctx.stroke()
  } else {
    selectorStartPoint = { x, y }
    lastSelectedPoints = { x, y }
  }

  // If grid is selected and user clicks it
  if (
    selectedLines.length > 0 &&
    x >= minSelectedX &&
    x <= maxSelectedX &&
    y >= minSelectedY &&
    y <= maxSelectedY
  ) {
    movingSelectedArea = true
  } else {
    selectedLines = []
  }
})

window.addEventListener('mousemove', (e) => {
  if (isPenLocked) return

  const x = e.clientX
  const y = e.clientY

  if (usingEraser) {
    customEraserCursor.style.left = `${x - eraserThickness / 2}px`
    customEraserCursor.style.top = `${y - eraserThickness / 2}px`
  }

  if (
    selectorStartPoint &&
    usingSelectorTool &&
    isMouseDown &&
    canvasPointStates.length > 0
  ) {
    // Clear canvas and redraw last state (remove previous selector outline)
    canvas.clear()
    drawPoints(canvasPointStates)
    ctx.lineWidth = '2'
    ctx.setLineDash([10])
    ctx.strokeStyle = 'GRAY'
    ctx.rect(
      selectorStartPoint.x,
      selectorStartPoint.y,
      x - selectorStartPoint.x,
      y - selectorStartPoint.y
    )
    ctx.stroke()
    ctx.setLineDash([0])
  }

  if (!usingSelectorTool) {
    pos.x = x
    pos.y = y
  }

  if (movingSelectedArea) {
    const distX = x - lastSelectedPoints.x
    const distY = y - lastSelectedPoints.y
    hasMovedSelectedArea = true

    lastSelectedPoints.x = x
    lastSelectedPoints.y = y

    // Update selectedLines points
    const tempLines = [...canvasPointStates]
    for (let line of selectedLines) {
      for (let point of line) {
        point.x += distX
        point.y += distY
      }
      tempLines.push(line)
    }

    canvas.clear()
    drawPoints(tempLines)
  }
})

window.addEventListener('mouseup', (e) => {
  if (isPenLocked) return

  const x = e.clientX
  const y = e.clientY

  isMouseDown = false

  if (hasMovedSelectedArea && movingSelectedArea) {
    canvas.clear()
    drawPoints(canvasPointStates)

    movingSelectedArea = false
    hasMovedSelectedArea = false
  }

  if (!usingSelectorTool) {
    // Add to total state and clear current point state
    // Don't register if inside toolbar or color tool popup
    if (
      (y >= minY && y <= maxY && x >= minX && x <= maxX) ||
      (!isPopUpHidden &&
        y >= popUpMinY &&
        y <= popUpMaxY &&
        x >= popUpMinX &&
        x <= popUpMaxX)
    )
      return

    if (!usingEraser) canvasPointStates.push([...currentPointState])

    currentPointState = []
  } else {
    selectorEndPoint = { x: e.clientX, y: e.clientY }
    handleSelector()
  }

  canvas.clear()
  drawPoints(canvasPointStates)
  saveCanvasData()
})

const init = () => {
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, canvas.getCW(), canvas.cH)
  ctx.lineWidth = 4

  // Auto-save enabled by default
  window.autoSaveEnabled = true

  // Load saved data
  loadCanvasData()

  // Set auto-save (every 30 seconds)
  setInterval(saveCanvasData, 30000)

  // Save before page closes
  window.addEventListener('beforeunload', saveCanvasData)

  setInterval(update, 0)
}

// Compress canvas data to reduce storage size
const compressCanvasData = (data) => {
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
const decompressCanvasData = (compressedData) => {
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
const getDataFromCookies = () => {
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
const saveCanvasData = () => {
  try {
    // If auto-save is disabled, do not execute save operation
    if (window.autoSaveEnabled === false) {
      return
    }

    // Save current page data to pagePointStates
    if (pagePointStates[currentPageIndex] !== canvasPointStates) {
      pagePointStates[currentPageIndex] = [...canvasPointStates]
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
const loadCanvasData = () => {
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

        canvasPointStates = pagePointStates[currentPageIndex] || []
        pageNumber.innerText = `${currentPageNum} of ${totalPages}`
        canvas.clear()
        drawPoints(canvasPointStates)
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

// Wallpaper Engine property listener
window.wallpaperPropertyListener = {
  applyUserProperties: function (properties) {
    // Process auto-save setting
    if (properties.autoSave !== undefined) {
      // Update auto-save setting
      window.autoSaveEnabled = properties.autoSave.value
      console.log('Auto-save setting: ' + window.autoSaveEnabled)
    }

    // Process theme color change
    if (properties.schemeColor) {
      // Theme color can be applied
      const color = properties.schemeColor.value.split(' ')
      const r = Math.ceil(color[0] * 255)
      const g = Math.ceil(color[1] * 255)
      const b = Math.ceil(color[2] * 255)
      const customColor = `rgb(${r}, ${g}, ${b})`
      COLORS.background = customColor

      canvas.clear()
      drawPoints(canvasPointStates)
    }
  }
}

init()

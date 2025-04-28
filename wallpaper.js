import { COLORS } from './config.js'
import { saveCanvasData, loadCanvasData } from './autosaveUtils.js'
import Canvas from './Canvas.js'
import Toolbar from './Toolbar.js'
import WallpaperPropertyListener from './WallpaperPropertyListener.js'

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

const toolbar = new Toolbar()

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

  toolbar.initDimensions()
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
      canvas.deletePointsInRadius({
        x: pos.x,
        y: pos.y,
        eraserThickness
      })
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
  toolbar.colorPickerButton.style.backgroundColor = COLORS.customColor
}

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
  pagePointStates[currentPageIndex] = [...canvas.getPointStateTimeline()]
  currentPageIndex--

  canvas.drawPoints({
    cPoints: pagePointStates[currentPageIndex],
    thickness,
    movedLinesMapping: []
  })
  canvasPointStates = pagePointStates[currentPageIndex]
  currentPageNum--
  pageNumber.innerText = `${currentPageNum} of ${totalPages}`
  saveCanvasData({
    pagePointStates,
    currentPageIndex,
    totalPages
  })
}

const handleNextPage = () => {
  canvas.clear()
  pagePointStates[currentPageIndex] = [...canvas.getPointStateTimeline()]
  currentPageIndex++

  if (pagePointStates[currentPageIndex]) {
    canvas.drawPoints({
      cPoints: pagePointStates[currentPageIndex],
      thickness,
      movedLinesMapping: []
    })
    canvas.setPointStateTimeline(pagePointStates[currentPageIndex])
  } else {
    totalPages++
    canvas.setPointStateTimeline([])
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
  canvas.drawPoints({
    cPoints: canvas.getPointStateTimeline(),
    thickness,
    movedLinesMapping: []
  })
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
  canvas.undo(thickness)
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
  for (let i = 0; i < canvas.getPointStateTimeline().length; i++) {
    for (let point of canvas.getPointStateTimeline()[i]) {
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
              JSON.stringify(line) ===
              JSON.stringify(canvas.getPointStateTimeline()[i])
          )
        ) {
          selectedLines.push([...canvas.getPointStateTimeline()[i]])
        }
        movedLinesMapping.push({
          originalLine: i,
          movedLine: canvas.getPointStateTimeline().length + numSelectionsCount
        })
        numSelectionsCount++
        break // Currently if any pixel touches the selected area
      }
    }
  }
}

const handleEraserCursorThickness = () => {
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
        canvas.setPointStateTimeline([])
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

window.addEventListener('mousedown', (e) => {
  if (isPenLocked) return

  const x = e.clientX
  const y = e.clientY

  if (toolbar.isIntersectingToolbarElements(x, y)) return
  toolbar.handleCloseColorPickerPopUp(x, y)

  // Remove selector outline
  if (selectorStartPoint) {
    canvas.clear()
    canvas.drawPoints({
      cPoints: canvas.getPointStateTimeline(),
      thickness,
      movedLinesMapping: []
    })
  }

  isMouseDown = true

  if (!usingSelectorTool) {
    currentPointState = []
    if (previousPos.x !== x && previousPos.y !== y) {
      if (usingEraser) {
        // Search for points within eraser radius and delete them
        canvas.deletePointsInRadius({
          x,
          y,
          eraserThickness
        })
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
    canvas.getPointStateTimeline().length > 0
  ) {
    // Clear canvas and redraw last state (remove previous selector outline)
    canvas.clear()
    canvas.drawPoints({
      cPoints: canvas.getPointStateTimeline(),
      thickness,
      movedLinesMapping: []
    })
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
    const tempLines = [...canvas.getPointStateTimeline()]
    for (let line of selectedLines) {
      for (let point of line) {
        point.x += distX
        point.y += distY
      }
      tempLines.push(line)
    }

    canvas.clear()
    canvas.drawPoints({
      cPoints: tempLines,
      thickness,
      movedLinesMapping: []
    })
  }
})

window.addEventListener('mouseup', (e) => {
  if (isPenLocked) return

  const x = e.clientX
  const y = e.clientY

  isMouseDown = false

  if (hasMovedSelectedArea && movingSelectedArea) {
    canvas.clear()
    canvas.drawPoints({
      cPoints: canvas.getPointStateTimeline(),
      thickness,
      movedLinesMapping: []
    })

    movingSelectedArea = false
    hasMovedSelectedArea = false
  }

  if (!usingSelectorTool) {
    // Add to total state and clear current point state
    // Don't register if inside toolbar or color tool popup
    if (toolbar.isIntersectingToolbarElements(x, y)) return

    if (!usingEraser)
      canvas.getPointStateTimeline().push([...currentPointState])

    currentPointState = []
  } else {
    selectorEndPoint = { x: e.clientX, y: e.clientY }
    handleSelector()
  }

  canvas.clear()
  canvas.drawPoints({
    cPoints: canvas.getPointStateTimeline(),
    thickness,
    movedLinesMapping: []
  })
  saveCanvasData({
    canvas,
    pagePointStates,
    currentPageIndex,
    totalPages
  })
})

const init = () => {
  // Init Event Listeners
  new WallpaperPropertyListener(canvas, thickness)

  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, canvas.getCW(), canvas.getCH())
  ctx.lineWidth = 4

  // Auto-save enabled by default
  window.autoSaveEnabled = true

  // Load saved data
  loadCanvasData({
    canvas,
    pagePointStates,
    currentPageIndex,
    currentPageNum,
    totalPages,
    pageNumber,
    thickness
  })

  // Set auto-save (every 30 seconds)
  setInterval(() => {
    saveCanvasData({
      canvas,
      pagePointStates,
      currentPageIndex,
      totalPages
    })
  }, 30000)
  // Save before page closes
  window.addEventListener('beforeunload', () => {
    saveCanvasData({
      canvas,
      pagePointStates,
      currentPageIndex,
      totalPages
    })
  })

  setInterval(update, 0)
}

init()

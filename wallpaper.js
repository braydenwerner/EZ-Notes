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
const inputColor = document.getElementById('input-color')
const sliderPen = document.getElementById('slider-pen')
const sliderEraser = document.getElementById('slider-eraser')
const undo = document.getElementById('undo')
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight
const baseHeight = canvas.height
let cW = canvas.width
let cH = canvas.height

//  should not be able to draw in the toolbar
let minX = toolbar.offsetLeft - toolbar.offsetWidth / 2
let maxX = toolbar.offsetLeft + toolbar.offsetWidth / 2
//  20 is the toolbar's margin-top
let minY = toolbar.offsetTop - toolbar.offsetHeight / 2 + 20
let maxY = toolbar.offsetTop + toolbar.offsetHeight / 2 + 20

//  color chooser popUp
let isPopUpHidden = true
//  set the position relative to screensize and toolbar
colorPickerContainer.style.width = '285px'
colorPickerContainer.style.height = '68px'
colorPickerContainer.style.left = minX + 'px'

let popUpMinX = minX
let popUpMaxX = minX + 285
let popUpMinY = 83
let popUpMaxY = 83 + 68

const colors = {
  background: 'rgb(40,44,52)',
  customColor: 'rgb(255,255,255)',
  purple: 'rgb(198,120,221)',
  darkPurple: 'rgb(150, 72, 173)',
  red: 'rgb(224, 108, 117)',
  darkRed: 'rgb(176, 60, 69)',
  green: 'rgb(152, 195, 121)',
  darkGreen: 'rgb(104, 147, 73)',
  blue: 'rgb(0, 194, 182)',
  darkBlue: 'rgb(0, 146, 134)',
  yellow: 'rgb(229, 192, 123)',
  darkYellow: 'rgb(191, 154, 85)'
}
let currentColor = colors.purple
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

//  stores canvas states to undo button
let canvasPointStates = []
//  create a smaller array to add to total canvas states array
let currentPointState = []
//  an array containing the canvasPointStates for each page
let pagePointStates = []
// an array of selected lines
let selectedLines = []
//  key-value array: key = index of initial pos in canvasPointStates,
//  value is index of new position in canvasPointStates after selected and moved
let movedLinesMapping = []

let minSelectedX, maxSelectedX, minSelectedY, maxSelectedY

//  custom dynamic eraser cursor
let cursorEraserWidth = eraserThickness
let cursorEraserHeight = eraserThickness
customEraserCursor.style.width = eraserThickness
customEraserCursor.style.height = eraserThickness

window.onresize = () => {
  canvas.width = window.innerWidth
  cW = canvas.width
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, cW, cH)

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
      //  add points between previousPos and currentPos,
      //  if the user draws a line very fast, points will be far apart

      //  minimum of 5 subpoints
      const numSubpoints = Math.max(5, diffsq / 2950)
      ctx.strokeStyle = currentColor
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.lineWidth = thickness
      for (let i = 1; i < numSubpoints; i++) {
        //  no need to update same position
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
      //  search for points within the eraser radius and remove them
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

  colors.customColor = `rgb(${redSlider.value},${greenSlider.value}, ${blueSlider.value})`
  currentColor = colors.customColor
  colorPickerButton.style.backgroundColor = colors.customColor
}

colorPickerButton.addEventListener('click', () => {
  isPopUpHidden = !isPopUpHidden

  if (isPopUpHidden) colorPickerContainer.style.display = 'none'
  else colorPickerContainer.style.display = 'inherit'
})

//  do not want to draw behind the container, so can just undo the line that is drawn
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
  //  check if previous page exists
  if (currentPageIndex === 0) return

  clearPage()
  pagePointStates[currentPageIndex] = [...canvasPointStates]
  currentPageIndex--

  drawPoints(pagePointStates[currentPageIndex])
  canvasPointStates = pagePointStates[currentPageIndex]
  currentPageNum--
  pageNumber.innerText = `${currentPageNum} of ${totalPages}`
}

const handleNextPage = () => {
  clearPage()
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
}

const handleToggleTheme = () => {
  if (colors.background === 'rgb(255,255,255)') {
    toggleTheme.style.background = `url('./assets/moon.png')`
    toggleTheme.style.backgroundRepeat = 'no-repeat'
    colors.background = 'rgb(40,44,52)'
  } else if (colors.background === 'rgb(40,44,52)') {
    toggleTheme.style.background = `url('./assets/sun1.png')`
    toggleTheme.style.backgroundRepeat = 'no-repeat'
    colors.background = 'rgb(255,255,255)'
  }
  clearPage()
  drawPoints(canvasPointStates)
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
  clearPage()
  drawPoints(canvasPointStates)
}

const handleSelector = () => {
  //  get all points between top-left and bottom-right
  minSelectedX = Math.min(selectorStartPoint.x, selectorEndPoint.x)
  maxSelectedX = Math.max(selectorStartPoint.x, selectorEndPoint.x)
  minSelectedY = Math.min(selectorStartPoint.y, selectorEndPoint.y)
  maxSelectedY = Math.max(selectorStartPoint.y, selectorEndPoint.y)

  //  save all points in the selected area
  let numSelectionsCount = 0
  for (let i = 0; i < canvasPointStates.length; i++) {
    for (let point of canvasPointStates[i]) {
      if (
        point.x >= minSelectedX &&
        point.x <= maxSelectedX &&
        point.y >= minSelectedY &&
        point.y <= maxSelectedY
      ) {
        //  if the line contains a point in selected region, add it to selectedLines array
        //  we have to check if selectedLines already contains canvasPointStates[i] or we get a bug
        //  in which there are duplicated lines which causes selectedLines to double in size upon each selection
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
        break //for now if any pixel is touching selected area
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

const drawPoints = (cPoints) => {
  for (let i = 0; i < cPoints.length; i++) {
    if (cPoints[i].length > 0) {
      ctx.strokeStyle = cPoints[i][0].currentColor
      ctx.lineWidth = cPoints[i][0].thick
    }

    //  if the line was selected and moved, don't draw the original
    movedLinesMapping = []
    /*
    for (let lineMap of movedLinesMapping) {
      if (lineMap.originalLine === i) lineMoved = true
    }
    if (lineMoved) continue
    */
    for (let pointIdx = 0; pointIdx < cPoints[i].length - 1; pointIdx++) {
      //  connect the two points
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cPoints[i][pointIdx].x, cPoints[i][pointIdx].y)
      ctx.lineTo(cPoints[i][pointIdx + 1].x, cPoints[i][pointIdx + 1].y)
      ctx.stroke()
    }
  }
  //  drawPoints changes lineWidth to previous point, have to change thickness back to current point
  ctx.lineWidth = thickness
}

const clearPage = () => {
  ctx.fillStyle = colors.background
  ctx.clearRect(0, 0, cW, cH)
  ctx.fillRect(0, 0, cW, cH)
}

//  add event listeners and background colors to pen color divs
document.querySelectorAll('.pen-color').forEach((colorButton) => {
  colorButton.addEventListener('click', () => {
    //  should not be able to do anything with locked screen, except unlock screen
    if (isPenLocked && colorButton.id !== 'pen-lock') return

    usingEraser = false
    usingSelectorTool = false

    customEraserCursor.style.display = 'none'

    if (previousButton) {
      switch (previousButton.id) {
        case 'color-picker-button':
          previousButton.style.backgroundColor = colors.customColor
          break
        case 'pen-purple':
          previousButton.style.backgroundColor = colors.purple
          break
        case 'pen-red':
          previousButton.style.backgroundColor = colors.red
          break
        case 'pen-blue':
          previousButton.style.backgroundColor = colors.blue
          break
        case 'pen-green':
          previousButton.style.backgroundColor = colors.green
          break
        case 'pen-yellow':
          previousButton.style.backgroundColor = colors.yellow
          break
      }
    }

    switch (colorButton.id) {
      case 'color-picker-button':
        colorButton.style.backgroundColor = colors.customColor
        currentColor = colors.customColor
        break
      case 'pen-purple':
        colorButton.style.backgroundColor = colors.darkPurple
        currentColor = colors.purple
        break
      case 'pen-red':
        colorButton.style.backgroundColor = colors.darkRed
        currentColor = colors.red
        break
      case 'pen-blue':
        colorButton.style.backgroundColor = colors.darkBlue
        currentColor = colors.blue
        break
      case 'pen-green':
        colorButton.style.backgroundColor = colors.darkGreen
        currentColor = colors.green
        break
      case 'pen-yellow':
        colorButton.style.backgroundColor = colors.darkYellow
        currentColor = colors.yellow
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
        clearPage()
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

const deletePointsInEraserRadius = (x, y) => {
  for (let i = 0; i < canvasPointStates.length; i++) {
    for (
      let pointIdx = 0;
      pointIdx < canvasPointStates[i].length - 1;
      pointIdx++
    ) {
      //  connect the two points
      const radius = eraserThickness / 2
      let xDist = canvasPointStates[i][pointIdx].x - x
      let yDist = canvasPointStates[i][pointIdx].y - y
      if (xDist * xDist + yDist * yDist <= radius * radius) {
        //  if you erase in the middle, have to turn one line into two
        //  or else the line will not render properly

        //  second line, insert new element at i+1
        canvasPointStates.splice(
          i + 1,
          0,
          [...canvasPointStates[i]].slice(
            pointIdx + 1,
            canvasPointStates[i].length
          )
        )
        //  first line
        canvasPointStates[i] = canvasPointStates[i].slice(0, pointIdx)

        //  filter out lines if it contains no points
        canvasPointStates = canvasPointStates.filter((line) => line.length > 1)
        pointIdx--
      }
    }
  }
  clearPage()
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

  // //  removed the outline of the selector
  if (selectorStartPoint) {
    clearPage()
    drawPoints(canvasPointStates)
  }

  isMouseDown = true

  if (!usingSelectorTool) {
    currentPointState = []
    if (previousPos.x !== x && previousPos.y !== y) {
      if (usingEraser) {
        //  search for points within the eraser radius and remove them
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

    //  if wallpaper on multiple monitors, possible to have mouse cords be out of bounds
    if (x < 1 || x >= cW - 1) return
    if (usingEraser) return

    previousPos.x = x
    previousPos.y = y

    //  draw a single dot point
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

  //  if a grid has been selected and user clicks it
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
    //  clear the canvas and redraw last state (removed the previous selector outline)
    clearPage()
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

    //  update selectedLines points
    const tempLines = [...canvasPointStates]
    for (let line of selectedLines) {
      for (let point of line) {
        point.x += distX
        point.y += distY
      }
      tempLines.push(line)
    }

    clearPage()
    drawPoints(tempLines)
  }
})

window.addEventListener('mouseup', (e) => {
  if (isPenLocked) return

  const x = e.clientX
  const y = e.clientY

  isMouseDown = false

  if (hasMovedSelectedArea && movingSelectedArea) {
    clearPage()
    drawPoints(canvasPointStates)

    movingSelectedArea = false
    hasMovedSelectedArea = false
  }

  if (!usingSelectorTool) {
    //  add to total state and clear current point state
    //  if within toolbar or the color tool popup do not register
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

  clearPage()
  drawPoints(canvasPointStates)
})

const init = () => {
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, cW, cH)
  ctx.lineWidth = 4

  setInterval(update, 0)
}
init()

// @TODO: Fix bugs with pagination
import { COLORS } from './config.js'
import { saveCanvasData, loadCanvasData } from './autosave.js'
import {
  addCustomColorSliderListeners,
  addWallpaperPropertyListener,
  addWindowResizeListener
} from './utils.js'

import Canvas from './Canvas.js'
import Toolbar from './toolbar/Toolbar.js'
import SliderPen from './toolbar/SliderPen.js'
import SliderEraser from './toolbar/SliderEraser.js'
import PenColors from './toolbar/PenColors.js'
import Eraser from './toolbar/Eraser.js'
import Selector from './toolbar/Selector.js'
import Undo from './toolbar/Undo.js'
import Reset from './toolbar/Reset.js'
import Pagination from './toolbar/Pagination.js'
import Theme from './toolbar/Theme.js'
import Lock from './toolbar/Lock.js'

export default class Wallpaper {
  constructor() {
    // HTML Elements
    this.customEraserCursor = document.getElementById('custom-eraser-cursor')
    this.pageNumber = document.getElementById('page-number')

    // State
    this.thickness
    this.eraserThickness
    this.previousButton
    this.currentPageIndex = 0
    this.currentPageNum = 1
    this.totalPages = 1

    this.isPenLocked = false
    this.usingSelectorTool = false
    this.usingEraser = false
    this.isMouseDown = false
    this.movingSelectedArea = false
    this.hasMovedSelectedArea = false

    this.pos = { x: 0, y: 0 }
    this.previousPos = { x: 0, y: 0 }
    this.selectorStartPoint
    this.selectorEndPoint
    this.lastSelectedPoints

    this.minSelectedX
    this.maxSelectedX
    this.minSelectedY
    this.maxSelectedY

    // Create a smaller array to add to the total canvas state array
    this.currentPointState = []
    // Array containing canvasPointStates for each page
    this.pagePointStates = []
    // Array of selected lines
    this.selectedLines = []
    // Key-value array: key=index in canvasPointStates of initial position,
    // value=index in canvasPointStates of new position after selection and movement
    this.movedLinesMapping = []

    // Initialize components
    this.canvas = new Canvas()
    this.ctx = this.canvas.getCtx()

    // @TODO: Stop prop drilling
    this.toolbar = new Toolbar()

    this.sliderPen = new SliderPen({
      ctx: this.ctx,
      getUsingEraser: this.getUsingEraser.bind(this),
      setThickness: this.setThickness.bind(this)
    })

    this.sliderEraser = new SliderEraser({
      ctx: this.ctx,
      getUsingEraser: this.getUsingEraser.bind(this),
      setEraserThickness: this.setEraserThickness.bind(this)
    })

    this.penColors = new PenColors({
      getIsPenLocked: this.getIsPenLocked.bind(this),
      getCustomEraserCursor: this.getCustomEraserCursor.bind(this),
      getPreviousButton: this.getPreviousButton.bind(this),
      setSelectedColor: this.setSelectedColor.bind(this),
      setPreviousButton: this.setPreviousButton.bind(this),
      resetToolbarState: this.resetToolbarState.bind(this)
    })

    this.eraser = new Eraser({
      setUsingEraser: this.setUsingEraser.bind(this),
      getCustomEraserCursor: this.getCustomEraserCursor.bind(this),
      getEraserThickness: this.getEraserThickness.bind(this),
      resetToolbarState: this.resetToolbarState.bind(this)
    })

    this.selector = new Selector({
      setUsingSelectorTool: this.setUsingSelectorTool.bind(this),
      resetToolbarState: this.resetToolbarState.bind(this),
      getSelectorStartPoint: this.getSelectorStartPoint.bind(this),
      getSelectorEndPoint: this.getSelectorEndPoint.bind(this),
      getCanvas: this.getCanvas.bind(this),
      getMovedLinesMapping: this.getMovedLinesMapping.bind(this),
      getSelectedLines: this.getSelectedLines.bind(this),
      setSelectedDimensions: this.setSelectedDimensions.bind(this)
    })

    this.undo = new Undo({
      getCanvas: this.getCanvas.bind(this),
      getPagePointStates: this.getPagePointStates.bind(this),
      getCurrentPageIndex: this.getCurrentPageIndex.bind(this),
      getTotalPages: this.getTotalPages.bind(this),
      getThickness: this.getThickness.bind(this),
      resetToolbarState: this.resetToolbarState.bind(this)
    })

    this.reset = new Reset({
      getCanvas: this.getCanvas.bind(this),
      resetToolbarState: this.resetToolbarState.bind(this)
    })

    this.pagination = new Pagination({
      getCanvas: this.getCanvas.bind(this),
      getPagePointStates: this.getPagePointStates.bind(this),
      getCurrentPageIndex: this.getCurrentPageIndex.bind(this),
      getTotalPages: this.getTotalPages.bind(this),
      getThickness: this.getThickness.bind(this),
      getPageNumber: this.getPageNumber.bind(this),
      getCurrentPageNum: this.getCurrentPageNum.bind(this),
      resetToolbarState: this.resetToolbarState.bind(this),
      setSelectedLines: this.setSelectedLines.bind(this)
    })

    this.theme = new Theme({
      getCanvas: this.getCanvas.bind(this),
      getPagePointStates: this.getPagePointStates.bind(this),
      getCurrentPageIndex: this.getCurrentPageIndex.bind(this),
      getTotalPages: this.getTotalPages.bind(this),
      getThickness: this.getThickness.bind(this)
    })

    this.lock = new Lock({
      getIsPenLocked: this.getIsPenLocked.bind(this),
      setIsPenLocked: this.setIsPenLocked.bind(this)
    })

    this.init()
  }

  init() {
    window.addEventListener('mousedown', (e) => {
      if (this.isPenLocked) return

      const x = e.clientX
      const y = e.clientY

      if (this.toolbar.isIntersectingToolbarElements(x, y)) return
      this.toolbar.handleCloseColorPickerPopUp(x, y)

      // Remove selector outline
      if (this.selectorStartPoint) {
        this.canvas.clear()
        this.canvas.drawPoints({
          cPoints: this.canvas.getPointStateTimeline(),
          thickness: this.thickness,
          movedLinesMapping: []
        })
      }

      this.isMouseDown = true

      if (!this.usingSelectorTool) {
        this.currentPointState = []
        if (this.previousPos.x !== x && this.previousPos.y !== y) {
          if (this.usingEraser) {
            // Search for points within eraser radius and delete them
            this.canvas.deletePointsInRadius({
              x,
              y,
              eraserThickness: this.eraserThickness
            })
          } else {
            this.currentPointState.push({
              x,
              y,
              currentColor: this.toolbar.getSelectedColor(),
              thick: this.thickness
            })
          }
        }

        // If wallpaper is on multiple displays, mouse coordinates may be out of bounds
        if (x < 1 || x >= this.canvas.getCW() - 1) return
        if (this.usingEraser) return

        this.previousPos.x = x
        this.previousPos.y = y

        // Draw single point
        this.ctx.strokeStyle = this.toolbar.getSelectedColor()
        this.ctx.beginPath()
        this.ctx.moveTo(x - 1, y - 1)
        this.ctx.lineTo(x + 1, y + 1)
        this.currentPointState.push({
          x: x - 1,
          y: y - 1,
          currentColor: this.toolbar.getSelectedColor(),
          thick: this.thickness
        })
        this.ctx.stroke()
      } else {
        this.selectorStartPoint = { x, y }
        this.lastSelectedPoints = { x, y }
      }

      // If grid is selected and user clicks it
      if (
        this.selectedLines.length > 0 &&
        x >= this.minSelectedX &&
        x <= this.maxSelectedX &&
        y >= this.minSelectedY &&
        y <= this.maxSelectedY
      ) {
        this.movingSelectedArea = true
      } else {
        this.selectedLines = []
      }
    })

    window.addEventListener('mousedown', (e) => {
      if (this.isPenLocked) return

      const x = e.clientX
      const y = e.clientY

      if (this.toolbar.isIntersectingToolbarElements(x, y)) return
      this.toolbar.handleCloseColorPickerPopUp(x, y)

      // Remove selector outline
      if (this.selectorStartPoint) {
        this.canvas.clear()
        this.canvas.drawPoints({
          cPoints: this.canvas.getPointStateTimeline(),
          thickness: this.thickness,
          movedLinesMapping: []
        })
      }

      this.isMouseDown = true

      if (!this.usingSelectorTool) {
        this.currentPointState = []
        if (this.previousPos.x !== x && this.previousPos.y !== y) {
          if (this.usingEraser) {
            // Search for points within eraser radius and delete them
            this.canvas.deletePointsInRadius({
              x,
              y,
              eraserThickness: this.eraserThickness
            })
          } else {
            this.currentPointState.push({
              x: this.pos.x,
              y: this.pos.y,
              currentColor: this.toolbar.getSelectedColor(),
              thick: this.thickness
            })
          }
        }

        // If wallpaper is on multiple displays, mouse coordinates may be out of bounds
        if (x < 1 || x >= this.canvas.getCW() - 1) return
        if (this.usingEraser) return

        this.previousPos.x = x
        this.previousPos.y = y

        // Draw single point
        this.ctx.strokeStyle = this.toolbar.getSelectedColor()
        this.ctx.beginPath()
        this.ctx.moveTo(x - 1, y - 1)
        this.ctx.lineTo(x + 1, y + 1)
        this.currentPointState.push({
          x: x - 1,
          y: y - 1,
          currentColor: this.toolbar.getSelectedColor(),
          thick: this.thickness
        })
        this.ctx.stroke()
      } else {
        this.selectorStartPoint = { x, y }
        this.lastSelectedPoints = { x, y }
      }

      // If grid is selected and user clicks it
      if (
        this.selectedLines.length > 0 &&
        x >= this.minSelectedX &&
        x <= this.maxSelectedX &&
        y >= this.minSelectedY &&
        y <= this.maxSelectedY
      ) {
        this.movingSelectedArea = true
      } else {
        this.selectedLines = []
      }
    })

    window.addEventListener('mousemove', (e) => {
      if (this.isPenLocked) return

      const x = e.clientX
      const y = e.clientY

      if (this.usingEraser) {
        this.customEraserCursor.style.left = `${x - this.eraserThickness / 2}px`
        this.customEraserCursor.style.top = `${y - this.eraserThickness / 2}px`
      }

      if (
        this.selectorStartPoint &&
        this.usingSelectorTool &&
        this.isMouseDown &&
        this.canvas.getPointStateTimeline().length > 0
      ) {
        // Clear canvas and redraw last state (remove previous selector outline)
        this.canvas.clear()
        this.canvas.drawPoints({
          cPoints: this.canvas.getPointStateTimeline(),
          thickness: this.thickness,
          movedLinesMapping: []
        })
        this.ctx.lineWidth = '2'
        this.ctx.setLineDash([10])
        this.ctx.strokeStyle = 'GRAY'
        this.ctx.rect(
          this.selectorStartPoint.x,
          this.selectorStartPoint.y,
          x - this.selectorStartPoint.x,
          y - this.selectorStartPoint.y
        )
        this.ctx.stroke()
        this.ctx.setLineDash([0])
      }

      if (!this.usingSelectorTool) {
        this.pos.x = x
        this.pos.y = y
      }

      if (this.movingSelectedArea) {
        const distX = x - this.lastSelectedPoints.x
        const distY = y - this.lastSelectedPoints.y
        this.hasMovedSelectedArea = true

        this.lastSelectedPoints.x = x
        this.lastSelectedPoints.y = y

        // Update selectedLines points
        const tempLines = [...this.canvas.getPointStateTimeline()]
        for (let line of this.selectedLines) {
          for (let point of line) {
            point.x += distX
            point.y += distY
          }
          tempLines.push(line)
        }

        this.canvas.clear()
        this.canvas.drawPoints({
          cPoints: tempLines,
          thickness: this.thickness,
          movedLinesMapping: []
        })
      }
    })

    window.addEventListener('mouseup', (e) => {
      if (this.isPenLocked) return

      const x = e.clientX
      const y = e.clientY

      this.isMouseDown = false

      if (this.hasMovedSelectedArea && this.movingSelectedArea) {
        this.canvas.clear()
        this.canvas.drawPoints({
          cPoints: this.canvas.getPointStateTimeline(),
          thickness: this.thickness,
          movedLinesMapping: []
        })

        this.movingSelectedArea = false
        this.hasMovedSelectedArea = false
      }

      if (!this.usingSelectorTool) {
        // Add to total state and clear current point state
        // Don't register if inside toolbar or color tool popup
        if (this.toolbar.isIntersectingToolbarElements(x, y)) return

        if (!this.usingEraser)
          this.canvas.getPointStateTimeline().push([...this.currentPointState])

        this.currentPointState = []
      } else {
        // There is a race condition where if a user clicks a color button,
        // it takes time for isUsingSelectorTool to be set to false because 'click' event is triggered
        // after 'mouseup' event
        if (!this.selectorStartPoint) return

        this.selectorEndPoint = { x: e.clientX, y: e.clientY }
        this.selector.handleSelector()
      }

      this.canvas.clear()
      this.canvas.drawPoints({
        cPoints: this.canvas.getPointStateTimeline(),
        thickness: this.thickness,
        movedLinesMapping: []
      })
      saveCanvasData({
        canvas: this.canvas,
        pagePointStates: this.pagePointStates,
        currentPageIndex: this.currentPageIndex,
        totalPages: this.totalPages
      })
    })

    this.ctx.fillStyle = COLORS.background
    this.ctx.fillRect(0, 0, this.canvas.getCW(), this.canvas.getCH())
    this.ctx.lineWidth = 4

    addCustomColorSliderListeners(this.toolbar)
    addWallpaperPropertyListener(this.canvas, this.thickness)
    addWindowResizeListener({
      ctx: this.ctx,
      canvas: this.canvas,
      thickness: this.thickness,
      toolbar: this.toolbar
    })

    // Auto-save enabled by default
    window.autoSaveEnabled = true

    // Load saved data
    loadCanvasData({
      canvas: this.canvas,
      pagePointStates: this.pagePointStates,
      currentPageIndex: this.currentPageIndex,
      currentPageNum: this.currentPageNum,
      totalPages: this.totalPages,
      pageNumber: this.pageNumber,
      thickness: this.thickness
    })

    // Set auto-save (every 30 seconds)
    setInterval(() => {
      saveCanvasData({
        canvas: this.canvas,
        pagePointStates: this.pagePointStates,
        currentPageIndex: this.currentPageIndex,
        totalPages: this.totalPages
      })
    }, 30000)
    // Save before page closes
    window.addEventListener('beforeunload', () => {
      saveCanvasData({
        canvas: this.canvas,
        pagePointStates: this.pagePointStates,
        currentPageIndex: this.currentPageIndex,
        totalPages: this.totalPages
      })
    })

    setInterval(() => this.update(), 0)
  }

  update() {
    const diffx = this.pos.x - this.previousPos.x
    const diffy = this.pos.y - this.previousPos.y
    const diffsq = diffx * diffx + diffy * diffy

    if (this.isMouseDown && diffsq >= 16) {
      if (!this.usingEraser) {
        // Add points between previousPos and currentPos,
        // If user draws lines quickly, points will be far apart

        // Minimum 5 subpoints
        const numSubpoints = Math.max(5, diffsq / 2950)
        this.ctx.strokeStyle = this.toolbar.getSelectedColor()
        this.ctx.lineJoin = 'round'
        this.ctx.lineCap = 'round'
        this.ctx.lineWidth = this.thickness
        for (let i = 1; i < numSubpoints; i++) {
          // No need to update same position
          if (
            i * (diffx / numSubpoints) === this.previousPos.x &&
            i * (diffy / numSubpoints === this.previousPos.y)
          )
            break
          this.currentPointState.push({
            x: this.previousPos.x + i * (diffx / numSubpoints),
            y: this.previousPos.y + i * (diffy / numSubpoints),
            currentColor: this.toolbar.getSelectedColor(),
            thick: this.thickness
          })
          this.ctx.beginPath()
          this.ctx.moveTo(
            this.previousPos.x + diffx / i,
            this.previousPos.y + diffy / i
          )
          this.ctx.lineTo(this.pos.x, this.pos.y)
          this.ctx.stroke()
        }
      } else {
        // Search for points within eraser radius and remove them
        this.canvas.deletePointsInRadius({
          x: this.pos.x,
          y: this.pos.y,
          eraserThickness: this.eraserThickness
        })
      }

      this.previousPos.x = this.pos.x
      this.previousPos.y = this.pos.y
    }
  }

  resetToolbarState() {
    this.usingEraser = false
    this.usingSelectorTool = false
    this.customEraserCursor.style.display = 'none'

    if (this.previousButton) {
      this.previousButton.style.backgroundColor =
        COLORS[this.previousButton.id.split('-')[1]] ?? COLORS.customColor
    }
  }

  // Getters and setters
  setThickness(thickness) {
    this.thickness = thickness
  }

  setEraserThickness(thickness) {
    this.eraserThickness = thickness
  }

  setUsingEraser(usingEraser) {
    this.usingEraser = usingEraser
  }

  setUsingSelectorTool(usingSelectorTool) {
    this.usingSelectorTool = usingSelectorTool
  }

  setSelectedColor(color) {
    this.toolbar.setSelectedColor(color)
  }

  setPreviousButton(colorButton) {
    this.previousButton = colorButton
  }

  getIsPenLocked() {
    return this.isPenLocked
  }

  getCustomEraserCursor() {
    return this.customEraserCursor
  }

  getPreviousButton() {
    return this.previousButton
  }

  getUsingEraser() {
    return this.usingEraser
  }

  getEraserThickness() {
    return this.eraserThickness
  }

  getCanvas() {
    return this.canvas
  }

  getPagePointStates() {
    return this.pagePointStates
  }

  getCurrentPageIndex() {
    return this.currentPageIndex
  }

  getTotalPages() {
    return this.totalPages
  }

  getThickness() {
    return this.thickness
  }

  getPageNumber() {
    return this.pageNumber
  }

  getCurrentPageNum() {
    return this.currentPageNum
  }

  setIsPenLocked(isPenLocked) {
    this.isPenLocked = isPenLocked
  }

  getSelectorStartPoint() {
    return this.selectorStartPoint
  }

  getSelectorEndPoint() {
    return this.selectorEndPoint
  }

  getMovedLinesMapping() {
    return this.movedLinesMapping
  }

  getSelectedLines() {
    return this.selectedLines
  }

  setSelectedDimensions(
    minSelectedX,
    maxSelectedX,
    minSelectedY,
    maxSelectedY
  ) {
    this.minSelectedX = minSelectedX
    this.maxSelectedX = maxSelectedX
    this.minSelectedY = minSelectedY
    this.maxSelectedY = maxSelectedY
  }

  setSelectedLines(selectedLines) {
    this.selectedLines = selectedLines
  }
}

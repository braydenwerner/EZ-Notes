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

export default class Wallpaper {
  constructor() {
    // HTML Elements
    this.toggleTheme = document.getElementById('toggle-theme')
    this.customEraserCursor = document.getElementById('custom-eraser-cursor')
    this.penLock = document.getElementById('pen-lock')
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

    // Create a smaller array to add to the total canvas state array
    this.currentPointState = []
    // Array containing canvasPointStates for each page
    this.pagePointStates = []
    // Array of selected lines
    this.selectedLines = []
    // Key-value array: key=index in canvasPointStates of initial position,
    // value=index in canvasPointStates of new position after selection and movement
    this.movedLinesMapping = []

    this.minSelectedX
    this.maxSelectedX
    this.minSelectedY
    this.maxSelectedY

    // Initialize components
    this.canvas = new Canvas()
    this.ctx = this.canvas.getCtx()

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
      setUsingEraser: this.setUsingEraser.bind(this),
      setUsingSelectorTool: this.setUsingSelectorTool.bind(this),
      setSelectedColor: this.setSelectedColor.bind(this),
      setPreviousButton: this.setPreviousButton.bind(this)
    })

    this.init()
  }

  init() {
    // Add event listeners and background COLORS for pen color divs
    document.querySelectorAll('.toolbar-item').forEach((colorButton) => {
      colorButton.addEventListener('click', () => {
        // When screen is locked, shouldn't be able to do anything except unlock screen
        if (this.isPenLocked && colorButton.id !== 'pen-lock') return

        this.usingEraser = false
        this.usingSelectorTool = false

        this.customEraserCursor.style.display = 'none'

        // if (this.previousButton) {
        //   switch (this.previousButton.id) {
        //     case 'color-picker-button':
        //       this.previousButton.style.backgroundColor = COLORS.customColor
        //       break
        //     case 'pen-purple':
        //       this.previousButton.style.backgroundColor = COLORS.purple
        //       break
        //     case 'pen-red':
        //       this.previousButton.style.backgroundColor = COLORS.red
        //       break
        //     case 'pen-blue':
        //       this.previousButton.style.backgroundColor = COLORS.blue
        //       break
        //     case 'pen-green':
        //       this.previousButton.style.backgroundColor = COLORS.green
        //       break
        //     case 'pen-yellow':
        //       this.previousButton.style.backgroundColor = COLORS.yellow
        //       break
        //   }
        // }

        switch (colorButton.id) {
          // case 'color-picker-button':
          //   colorButton.style.backgroundColor = COLORS.customColor
          //   this.toolbar.setSelectedColor(COLORS.customColor)
          //   break
          // case 'pen-purple':
          //   colorButton.style.backgroundColor = COLORS.darkPurple
          //   this.toolbar.setSelectedColor(COLORS.purple)
          //   break
          // case 'pen-red':
          //   colorButton.style.backgroundColor = COLORS.darkRed
          //   this.toolbar.setSelectedColor(COLORS.red)
          //   break
          // case 'pen-blue':
          //   colorButton.style.backgroundColor = COLORS.darkBlue
          //   this.toolbar.setSelectedColor(COLORS.blue)
          //   break
          // case 'pen-green':
          //   colorButton.style.backgroundColor = COLORS.darkGreen
          //   this.toolbar.setSelectedColor(COLORS.green)
          //   break
          // case 'pen-yellow':
          //   colorButton.style.backgroundColor = COLORS.darkYellow
          //   this.toolbar.setSelectedColor(COLORS.yellow)
          //   break
          case 'eraser':
            this.usingEraser = true
            this.customEraserCursor.style.display = 'initial'
            // this.handleEraserCursorThickness()
            break

          case 'selector':
            this.usingSelectorTool = true
            break
          case 'undo':
            this.handleUndo()
            break
          case 'reset':
            this.canvas.setPointStateTimeline([])
            this.canvas.clear()
            // Clear saved data
            localStorage.removeItem('ez-notes-data')
            // Clear all data block cookies
            for (let i = 0; i <= 20; i++) {
              document.cookie = `ez_data_${i}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            }
            document.cookie = `ez_data_chunks=0; path=/; max-age=31536000`
            break
          case 'previous-page':
            this.handlePreviousPage()
            break
          case 'next-page':
            this.handleNextPage()
            break
          case 'toggle-theme':
            this.handleToggleTheme()
            break
          case 'pen-lock':
            this.handlePenLocked()
            break
        }
        this.ctx.lineWidth =
          colorButton.id === 'eraser' ? this.eraserThickness : this.thickness
        this.previousButton = colorButton
      })
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
        this.selectorEndPoint = { x: e.clientX, y: e.clientY }
        this.handleSelector()
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

  handlePreviousPage() {
    // Check if previous page exists
    if (this.currentPageIndex === 0) return

    this.canvas.clear()
    this.pagePointStates[this.currentPageIndex] = [
      ...this.canvas.getPointStateTimeline()
    ]
    this.currentPageIndex--

    this.canvas.drawPoints({
      cPoints: this.pagePointStates[this.currentPageIndex],
      thickness: this.thickness,
      movedLinesMapping: []
    })
    this.currentPageNum--
    this.pageNumber.innerText = `${this.currentPageNum} of ${this.totalPages}`
    saveCanvasData({
      canvas: this.canvas,
      pagePointStates: this.pagePointStates,
      currentPageIndex: this.currentPageIndex,
      totalPages: this.totalPages
    })
  }

  handleNextPage() {
    this.canvas.clear()
    this.pagePointStates[this.currentPageIndex] = [
      ...this.canvas.getPointStateTimeline()
    ]
    this.currentPageIndex++

    if (this.pagePointStates[this.currentPageIndex]) {
      this.canvas.drawPoints({
        cPoints: this.pagePointStates[this.currentPageIndex],
        thickness: this.thickness,
        movedLinesMapping: []
      })
      this.canvas.setPointStateTimeline(
        this.pagePointStates[this.currentPageIndex]
      )
    } else {
      this.totalPages++
      this.canvas.setPointStateTimeline([])
    }
    this.currentPageNum++
    this.pageNumber.innerText = `${this.currentPageNum} of ${this.totalPages}`
    saveCanvasData({
      canvas: this.canvas,
      pagePointStates: this.pagePointStates,
      currentPageIndex: this.currentPageIndex,
      totalPages: this.totalPages
    })
  }

  handleToggleTheme() {
    // Check if current background color is close to white
    const isLightTheme =
      COLORS.background.includes('255,255,255') ||
      (COLORS.background.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) &&
        parseInt(RegExp.$1) > 200 &&
        parseInt(RegExp.$2) > 200 &&
        parseInt(RegExp.$3) > 200)

    if (isLightTheme) {
      // Switch to dark theme
      this.toggleTheme.style.background = `url('./assets/moon.png')`
      this.toggleTheme.style.backgroundRepeat = 'no-repeat'
      COLORS.background = 'rgb(40,44,52)'
    } else {
      // Switch to light theme
      this.toggleTheme.style.background = `url('./assets/sun1.png')`
      this.toggleTheme.style.backgroundRepeat = 'no-repeat'
      COLORS.background = 'rgb(255,255,255)'
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
  }

  handlePenLocked() {
    this.isPenLocked = !this.isPenLocked

    if (this.isPenLocked) {
      this.penLock.style.background = `url('./assets/padlock.png')`
      this.penLock.style.backgroundRepeat = 'no-repeat'
    } else {
      this.penLock.style.background = `url('./assets/open-padlock.png')`
      this.penLock.style.backgroundRepeat = 'no-repeat'
    }
  }

  handleUndo() {
    this.canvas.undo(this.thickness)
    saveCanvasData({
      canvas: this.canvas,
      pagePointStates: this.pagePointStates,
      currentPageIndex: this.currentPageIndex,
      totalPages: this.totalPages
    })
  }

  handleSelector() {
    this.minSelectedX = Math.min(
      this.selectorStartPoint.x,
      this.selectorEndPoint.x
    )
    this.maxSelectedX = Math.max(
      this.selectorStartPoint.x,
      this.selectorEndPoint.x
    )
    this.minSelectedY = Math.min(
      this.selectorStartPoint.y,
      this.selectorEndPoint.y
    )
    this.maxSelectedY = Math.max(
      this.selectorStartPoint.y,
      this.selectorEndPoint.y
    )

    // Save all points in the selected area
    let numSelectionsCount = 0
    for (let i = 0; i < this.canvas.getPointStateTimeline().length; i++) {
      for (let point of this.canvas.getPointStateTimeline()[i]) {
        if (
          point.x >= this.minSelectedX &&
          point.x <= this.maxSelectedX &&
          point.y >= this.minSelectedY &&
          point.y <= this.maxSelectedY
        ) {
          // If a line contains points in the selected area, add it to selectedLines array
          // We must check if selectedLines already contains canvasPointStates[i], otherwise there will be an error
          // Where there are duplicate lines, causing selectedLines size to double with each selection
          if (
            !this.selectedLines.some(
              (line) =>
                JSON.stringify(line) ===
                JSON.stringify(this.canvas.getPointStateTimeline()[i])
            )
          ) {
            this.selectedLines.push([...this.canvas.getPointStateTimeline()[i]])
          }
          this.movedLinesMapping.push({
            originalLine: i,
            movedLine:
              this.canvas.getPointStateTimeline().length + numSelectionsCount
          })
          numSelectionsCount++
          break // Currently if any pixel touches the selected area
        }
      }
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
}

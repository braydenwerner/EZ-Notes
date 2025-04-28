import { COLORS } from './config.js'

export default class Canvas {
  constructor() {
    this.canvas = document.getElementById('canvas')
    this.ctx = this.canvas.getContext('2d')

    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight

    this.baseHeight = this.canvas.height

    // Store canvas state for undo button
    this.pointStateTimeline = []
  }

  drawPoints({ cPoints, thickness, movedLinesMapping }) {
    for (let i = 0; i < cPoints.length; i++) {
      if (cPoints[i].length > 0) {
        this.ctx.strokeStyle = cPoints[i][0].currentColor
        this.ctx.lineWidth = cPoints[i][0].thick
      }

      // If line is selected and moved, don't draw original line
      movedLinesMapping = []

      for (let pointIdx = 0; pointIdx < cPoints[i].length - 1; pointIdx++) {
        // Connect two points
        this.ctx.lineJoin = 'round'
        this.ctx.lineCap = 'round'
        this.ctx.beginPath()
        this.ctx.moveTo(cPoints[i][pointIdx].x, cPoints[i][pointIdx].y)
        this.ctx.lineTo(cPoints[i][pointIdx + 1].x, cPoints[i][pointIdx + 1].y)
        this.ctx.stroke()
      }
    }
    // drawPoints changes line width to previous point's width, must change thickness back to current point
    this.ctx.lineWidth = thickness
  }

  deletePointsInRadius({ x, y, eraserThickness }) {
    for (let i = 0; i < this.pointStateTimeline.length; i++) {
      for (
        let pointIdx = 0;
        // TODO: pointStateTimeline[i] should be defined, but it's not all the time
        pointIdx < this.pointStateTimeline[i]?.length - 1;
        pointIdx++
      ) {
        // Connect two points
        const radius = eraserThickness / 2
        let xDist = this.pointStateTimeline[i][pointIdx].x - x
        let yDist = this.pointStateTimeline[i][pointIdx].y - y
        if (xDist * xDist + yDist * yDist <= radius * radius) {
          // If erasing in the middle, must split one line into two
          // Otherwise lines won't render correctly

          // Second line, insert new element at i+1
          this.pointStateTimeline.splice(
            i + 1,
            0,
            [...this.pointStateTimeline[i]].slice(
              pointIdx + 1,
              this.pointStateTimeline[i].length
            )
          )
          // First line
          this.pointStateTimeline[i] = this.pointStateTimeline[i].slice(
            0,
            pointIdx
          )

          // Filter out lines that don't contain points
          this.pointStateTimeline = this.pointStateTimeline.filter(
            (line) => line.length > 1
          )
          pointIdx--
        }
      }
    }
    this.clear()
    this.drawPoints({
      cPoints: this.pointStateTimeline,
      thickness: eraserThickness,
      movedLinesMapping: []
    })
  }

  clear() {
    this.ctx.fillStyle = COLORS.background
    this.ctx.clearRect(0, 0, this.getCW(), this.getCH())
    this.ctx.fillRect(0, 0, this.getCW(), this.getCH())
  }

  undo(thickness) {
    this.pointStateTimeline.pop()
    this.clear()
    this.drawPoints({
      cPoints: this.pointStateTimeline,
      thickness: thickness,
      movedLinesMapping: []
    })
  }

  getCtx() {
    return this.ctx
  }

  getCW() {
    return this.canvas.width
  }

  setCW(width) {
    this.canvas.width = width
  }

  getCH() {
    return this.canvas.height
  }

  setCH(height) {
    this.canvas.height = height
  }

  getPointStateTimeline() {
    return this.pointStateTimeline
  }

  setPointStateTimeline(pointStateTimeline) {
    this.pointStateTimeline = pointStateTimeline
  }
}

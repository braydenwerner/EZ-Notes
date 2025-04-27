import { COLORS } from './config.js'

export default class Canvas {
  constructor() {
    this.canvas = document.getElementById('canvas')
    this.ctx = this.canvas.getContext('2d')

    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight

    this.baseHeight = this.canvas.height
  }

  clear() {
    this.ctx.fillStyle = COLORS.background
    this.ctx.clearRect(0, 0, this.getCW(), this.getCH())
    this.ctx.fillRect(0, 0, this.getCW(), this.getCH())
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
}

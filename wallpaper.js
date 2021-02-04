import { currentColor, colors } from './constants.js'
import { initToolbar } from './toolbar.js'

const canvas = document.getElementById('canvas')
export const ctx = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.body.appendChild(canvas)

//  init values
const cW = canvas.width
const cH = canvas.height

let isMouseDown = false
let pos = { x: 0, y: 0 }
let previousPos = { x: 0, y: 0 }

const update = () => {
  const diffx = pos.x - previousPos.x
  const diffy = pos.y - previousPos.y
  const diffsq = diffx * diffx + diffy * diffy

  if (isMouseDown && diffsq >= 16) {
    ctx.strokeStyle = currentColor
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(previousPos.x, previousPos.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    previousPos.x = pos.x
    previousPos.y = pos.y
  }
}

window.addEventListener('mousedown', (e) => {
  const x = e.clientX
  const y = e.clientY

  //  if wallpaper on multiple monitors, possible to have mouse cords be out of bounds
  if (x < 1 || x >= cW - 1) return

  isMouseDown = true
  previousPos.x = x
  previousPos.y = y

  ctx.strokeStyle = currentColor
  ctx.beginPath()
  ctx.moveTo(e.clientX - 1, e.clientY - 1)
  ctx.lineTo(e.clientX + 1, e.clientY + 1)
  ctx.stroke()
})

window.addEventListener('mousemove', (e) => {
  pos.x = e.clientX
  pos.y = e.clientY
})

window.addEventListener('mouseup', (e) => {
  isMouseDown = false
})

const init = () => {
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, cW, cH)
  ctx.lineWidth = 4

  initToolbar()

  setInterval(update, 0)
}
init()

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.body.appendChild(canvas)

//  init values
const cW = canvas.width
const cH = canvas.height

const inputColor = document.getElementById('input-color')
const slider = document.getElementById('slider')

const colors = {
  background: 'rgb(40,44,52)',
  purple: 'rgb(198,120,221)',
  red: 'rgb(224, 108, 117)',
  green: 'rgb(152, 195, 121)',
  blue: ' rgb(0, 194, 182)',
  yellow: 'rgb(229, 192, 123)'
}

let currentColor = colors.purple

let thickness = 4
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

slider.addEventListener('input', () => {
  thickness = slider.value
  ctx.lineWidth = thickness
})

//  custom color input
inputColor.addEventListener('input', () => {
  color = inputColor.value
})

//  add event listeners and background colors to pen color divs
document.querySelectorAll('.pen-color').forEach((item) => {
  item.addEventListener('click', () => {
    switch (item.id) {
      case 'pen-purple':
        currentColor = colors.purple
        break
      case 'pen-red':
        currentColor = colors.red
        break
      case 'pen-blue':
        currentColor = colors.blue
        break
      case 'pen-green':
        currentColor = colors.green
        break
      case 'pen-yellow':
        currentColor = colors.yellow
        break
      case 'reset':
        ctx.fillStyle = colors.background
        ctx.clearRect(0, 0, cW, cH)
        ctx.fillRect(0, 0, cW, cH)
        break
      case 'eraser':
        currentColor = colors.background
        break
    }
    ctx.lineWidth = item.id === 'eraser' ? 18 : thickness
  })
})

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

  setInterval(update, 0)
}
init()

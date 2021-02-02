const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.body.appendChild(canvas)

const cW = canvas.width
const cH = canvas.height

//  for key binds
let map = []

let isMouseDown = false
let color = 'rgb(198, 120, 221)'
let pos = { x: 0, y: 0 }
let previousPos = { x: 0, y: 0 }

//  background
let backgroundColor = 'rgb(40,44,52)'
ctx.fillStyle = backgroundColor
ctx.fillRect(0, 0, cW, cH)

const update = () => {
  checkKeyBinds()

  //  render board

  if (
    isMouseDown &&
    Math.hypot(pos.x - previousPos.x, pos.y - previousPos.y) >= 5
  ) {
    ctx.lineWidth = 1
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(previousPos.x, previousPos.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.lineWidth = 3
    ctx.stroke()

    previousPos.x = pos.x
    previousPos.y = pos.y
  }

  // // draw date
  // const date = new Date()
  // ctx.font = '30px Arial'
  // ctx.clearRect(cW / 1.19, cH / 39, 200, 30)
  // ctx.fillStyle = 'rgb(40,44,52)'
  // ctx.fillRect(cW / 1.2, cH / 39, 200, 35)
  // ctx.fillStyle = 'WHITE'
  // ctx.fillText(
  //   `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`,
  //   cW / 1.19,
  //   cH / 20
  // )
}

const checkKeyBinds = () => {
  if (map.includes('ShiftLeft') && map.includes('Backspace')) {
    map = []
    ctx.fillStyle = backgroundColor
    ctx.clearRect(0, 0, cW, cH)
    ctx.fillRect(0, 0, cW, cH)
  }

  if (map.includes('ShiftLeft') && map.includes('KeyT')) {
    map = []
    backgroundColor = backgroundColor === 'WHITE' ? 'rgb(40,44,52)' : 'WHITE'
    ctx.fillStyle = backgroundColor
    ctx.clearRect(0, 0, cW, cH)
    ctx.fillRect(0, 0, cW, cH)
  }
}

const init = () => {
  setInterval(update, 0)
  const date = new Date()
}
init()

window.addEventListener('mousedown', (e) => {
  const x = e.clientX
  const y = e.clientY

  //  if wallpaper on multiple monitors, possible to have mouse cords be out of bounds
  if (x < 1 || x >= cW - 1) return

  isMouseDown = true
  previousPos.x = x
  previousPos.y = y
})

window.addEventListener('mousemove', (e) => {
  pos.x = e.clientX
  pos.y = e.clientY
})

window.addEventListener('mouseup', (e) => {
  isMouseDown = false

  //  draw a dot if the user simply clicks the screen
  if (Math.hypot(pos.x - previousPos.x, pos.y - previousPos.y) < 3) {
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(e.clientX, e.clientY)
    ctx.lineTo(e.clientX + 2, e.clientY + 4)
    //ctx.lineWidth = 3
    ctx.stroke()
  }
})

//  add event listeners to pen color divs
document.querySelectorAll('.pen-color').forEach((item) => {
  item.addEventListener('click', () => {
    switch (item.id) {
      case 'pen-purple':
        color = 'rgb(198, 120, 221)'
        ctx.lineWidth = 3
        break
      case 'pen-red':
        color = 'rgb(224, 108, 117)'
        ctx.lineWidth = 3
        break
      case 'pen-blue':
        color = 'rgb(0, 194, 182)'
        ctx.lineWidth = 3
        break
      case 'pen-green':
        color = 'rgb(152, 195, 121)'
        ctx.lineWidth = 3
        break
      case 'pen-yellow':
        color = 'rgb(229, 192, 123)'
        ctx.lineWidth = 3
        break
      case 'pen-erase':
        ctx.fillStyle = backgroundColor
        ctx.clearRect(0, 0, cW, cH)
        ctx.fillRect(0, 0, cW, cH)
        break
      case 'eraser':
        color = 'rgb(40,44,52)'
        ctx.lineWidth = 10
        break
    }
  })
})

//  hotkeys
window.addEventListener('keydown', (e) => {
  if (!map.includes(e.code)) map.push(e.code)
})

window.addEventListener('keyup', (e) => {
  map.filter((key) => key != e.code)
  map = map.filter((key) => key != e.code)
})

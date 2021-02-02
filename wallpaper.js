const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.body.appendChild(canvas)

const cW = canvas.width
const cH = canvas.height

let isMouseDown = false
let color = 'rgb(198, 120, 221)'
let pos = { x: 0, y: 0 }
let previousPos = { x: 0, y: 0 }

//  background
ctx.fillStyle = 'rgb(40,44,52)'
ctx.fillRect(0, 0, cW, cH)

const update = () => {
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
})

//  add event listeners to pen color divs
document.querySelectorAll('.pen-color').forEach((item) => {
  console.log(item.id)
  item.addEventListener('click', (event) => {
    console.log(item.id)
    switch (item.id) {
      case 'pen-purple':
        color = 'rgb(198, 120, 221)'
        break
      case 'pen-red':
        color = 'rgb(224, 108, 117)'
        break
      case 'pen-blue':
        color = 'rgb(0, 194, 182)'
        break
      case 'pen-green':
        color = 'rgb(152, 195, 121)'
        break
      case 'pen-yellow':
        color = 'rgb(229, 192, 123)'
        break
      case 'pen-erase':
        ctx.fillStyle = 'rgb(40,44,52)'
        ctx.clearRect(0, 0, cW, cH)
        ctx.fillRect(0, 0, cW, cH)
        break
    }
  })
})

//  hotkeys
const map = []
window.addEventListener('')

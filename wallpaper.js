const inputColor = document.getElementById('input-color')

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
ctx.lineWidth = 4;

const update = () => {
  checkKeyBinds()

  let diffx = pos.x - previousPos.x
  let diffy = pos.y - previousPos.y
  let diffsq = diffx * diffx + diffy * diffy

  if (isMouseDown && diffsq >= 16) {
    ctx.strokeStyle = color
    lineJoin = "round";
    lineCap = "round";
    ctx.beginPath()
    ctx.moveTo(previousPos.x, previousPos.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    previousPos.x = pos.x
    previousPos.y = pos.y
  }
}

//slider
let thickness = 4;
var slider = document.getElementById("slider");


slider.oninput = function() {
  thickness = this.value;
  ctx.lineWidth = thickness;
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

//  hotkeys
window.addEventListener('keydown', (e) => {
  if (!map.includes(e.code)) map.push(e.code)
})

window.addEventListener('keyup', (e) => {
  map.filter((key) => key != e.code)
  map = map.filter((key) => key != e.code)
})

const init = () => {
  setInterval(update, 0)
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

  ctx.strokeStyle = color
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

//  custom color input
inputColor.addEventListener('input', () => {
  color = inputColor.value
})

//  add event listeners to pen color divs
document.querySelectorAll('.pen-color').forEach((item) => {
  item.addEventListener('click', () => {
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
        ctx.fillStyle = backgroundColor
        ctx.clearRect(0, 0, cW, cH)
        ctx.fillRect(0, 0, cW, cH)
        break
      case 'eraser':
        color = 'rgb(40,44,52)'
        break
    }
<<<<<<< HEAD
    ctx.lineWidth = item.id === 'eraser' ? 15 : 3
  })
=======
    ctx.lineWidth = item.id == 'eraser' ? 15 : thickness
    })
>>>>>>> a78adeb8cf2c361acb64635c23ff038dedb9b4f0
})

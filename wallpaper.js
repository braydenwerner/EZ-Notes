const inputColor = document.getElementById('input-color')
const slider = document.getElementById('slider')
const undo = document.getElementById('undo')

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.body.appendChild(canvas)

//  init values
const cW = canvas.width
const cH = canvas.height

const colors = {
  background: 'rgb(40,44,52)',
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
//  array of html button elements, needed to manipulate toolbar colors
let previousButton

let thickness = 4
let isMouseDown = false
let pos = { x: 0, y: 0 }
let previousPos = { x: 0, y: 0 }

//  should not be able to draw in the toolbar
const minY = 100

//  stores canvas states to undo button
let canvasPointStates = []

//  create a smaller array to add to total canvas states array
let currentPointState = []

const update = () => {
  const diffx = pos.x - previousPos.x
  const diffy = pos.y - previousPos.y
  const diffsq = diffx * diffx + diffy * diffy

  if (isMouseDown && diffsq >= 16) {
    if (pos.y > minY)
      currentPointState.push({ x: pos.x, y: pos.y, currentColor, thickness })

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

undo.addEventListener('click', () => {
  canvasPointStates.pop()

  ctx.fillStyle = colors.background
  ctx.clearRect(0, 0, cW, cH)
  ctx.fillRect(0, 0, cW, cH)

  //  re-render canvas
  for (let pointState of canvasPointStates) {
    if (pointState.length > 0) {
      ctx.strokeStyle = pointState[0].currentColor
      ctx.lineWidth = pointState[0].thickness
    }

    for (let pointIdx = 0; pointIdx < pointState.length - 1; pointIdx++) {
      //  connect the two points
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(pointState[pointIdx].x, pointState[pointIdx].y)
      ctx.lineTo(pointState[pointIdx + 1].x, pointState[pointIdx + 1].y)
      ctx.stroke()
    }
  }
})

//  add event listeners and background colors to pen color divs
document.querySelectorAll('.pen-color').forEach((colorButton) => {
  colorButton.addEventListener('click', () => {
    if (previousButton) {
      switch (previousButton.id) {
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
        currentColor = colors.background
        break
      case 'reset':
        canvasPointStates = []
        ctx.fillStyle = colors.background
        ctx.clearRect(0, 0, cW, cH)
        ctx.fillRect(0, 0, cW, cH)
        break
    }
    ctx.lineWidth = colorButton.id === 'eraser' ? 18 : thickness
    previousButton = colorButton
  })
})

const resetColors = () => {}

window.addEventListener('mousedown', (e) => {
  const x = e.clientX
  const y = e.clientY

  currentPointState = []
  if (previousPos.x !== x && previousPos.y !== y && y > minY) {
    currentPointState.push({ x, y, currentColor, thickness })
  }

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

  //  add to total state and clear current point state
  if (e.clientY > minY) {
    canvasPointStates.push([...currentPointState])
  }
  currentPointState = []
})

const init = () => {
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, cW, cH)
  ctx.lineWidth = 4

  setInterval(update, 0)
}
init()

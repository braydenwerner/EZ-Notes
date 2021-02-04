import {
  colors,
  currentColor,
  setCurrentColor,
  thickness,
  setThickness
} from './constants.js'
import { ctx } from './wallpaper.js'

const inputColor = document.getElementById('input-color')
const slider = document.getElementById('slider')

export const initToolbar = () => {
  slider.addEventListener('input', () => {
    setThickness(slider.value)
    ctx.lineWidth = slider.value
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
          setCurrentColor(colors.purple)
          break
        case 'pen-red':
          setCurrentColor(colors.red)
          break
        case 'pen-blue':
          setCurrentColor(colors.blue)
          break
        case 'pen-green':
          setCurrentColor(colors.green)
          break
        case 'pen-yellow':
          setCurrentColor(colors.yellow)
          break
        case 'pen-erase':
          ctx.fillStyle = colors.background
          ctx.clearRect(0, 0, cW, cH)
          ctx.fillRect(0, 0, cW, cH)
          break
        case 'eraser':
          setCurrentColor(colors.background)
          break
      }
      ctx.lineWidth = item.id === 'eraser' ? 18 : thickness
    })
  })
}

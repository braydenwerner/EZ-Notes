import { COLORS } from './config.js'
export function addCustomColorSliderListeners(toolbar) {
  const redSlider = document.getElementById('red-slider')
  const greenSlider = document.getElementById('green-slider')
  const blueSlider = document.getElementById('blue-slider')
  const colorRedValue = document.getElementById('color-red-value')
  const colorGreenValue = document.getElementById('color-green-value')
  const colorBlueValue = document.getElementById('color-blue-value')

  function setCustomColor() {
    colorRedValue.innerText = 'R: ' + redSlider.value
    colorGreenValue.innerText = 'G: ' + greenSlider.value
    colorBlueValue.innerText = 'B: ' + blueSlider.value

    const customColor = `rgb(${redSlider.value},${greenSlider.value},${blueSlider.value})`
    toolbar.setSelectedColor(customColor)
    toolbar.colorPickerButton.style.backgroundColor = customColor
  }

  redSlider.addEventListener('input', () => setCustomColor())
  greenSlider.addEventListener('input', () => setCustomColor())
  blueSlider.addEventListener('input', () => setCustomColor())
}

export function addWallpaperPropertyListener(canvas, thickness) {
  window.wallpaperPropertyListener = {
    applyUserProperties: function (properties) {
      // Process auto-save setting
      if (properties.autoSave !== undefined) {
        // Update auto-save setting
        window.autoSaveEnabled = properties.autoSave.value
        console.log('Auto-save setting: ' + window.autoSaveEnabled)
      }

      // Process theme color change
      if (properties.schemeColor) {
        // Theme color can be applied
        const color = properties.schemeColor.value.split(' ')
        const r = Math.ceil(color[0] * 255)
        const g = Math.ceil(color[1] * 255)
        const b = Math.ceil(color[2] * 255)
        const customColor = `rgb(${r}, ${g}, ${b})`
        COLORS.background = customColor

        canvas.clear()
        canvas.drawPoints({
          cPoints: canvas.getCanvasPointStates(),
          thickness,
          movedLinesMapping: []
        })
      }
    }
  }
}

export function addWindowResizeListener({ canvas, thickness, toolbar }) {
  window.onresize = () => {
    canvas.setCW(window.innerWidth)
    canvas.setCH(window.innerHeight)

    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, canvas.getCW(), canvas.getCH())

    ctx.lineWidth = thickness

    toolbar.initDimensions()
  }
}

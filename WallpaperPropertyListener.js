import { COLORS } from './config.js'

export default class WallpaperPropertyListener {
  constructor(canvas, canvasPointStates, thickness) {
    // Wallpaper Engine property listener
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
}

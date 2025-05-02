import { COLORS } from '../config.js'
import { saveCanvasData } from '../autosave.js'

export default class Theme {
  constructor({
    getCanvas,
    getPagePointStates,
    getCurrentPageIndex,
    getTotalPages,
    getThickness
  }) {
    this.canvas = getCanvas()
    this.pagePointStates = getPagePointStates()
    this.currentPageIndex = getCurrentPageIndex()
    this.totalPages = getTotalPages()
    this.thickness = getThickness()

    const toggleTheme = document.getElementById('toggle-theme')

    toggleTheme.addEventListener('click', () => {
      // Check if current background color is close to white
      const isLightTheme =
        COLORS.background.includes('255,255,255') ||
        (COLORS.background.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) &&
          parseInt(RegExp.$1) > 200 &&
          parseInt(RegExp.$2) > 200 &&
          parseInt(RegExp.$3) > 200)

      if (isLightTheme) {
        // Switch to dark theme
        toggleTheme.style.background = `url('./assets/moon.png')`
        toggleTheme.style.backgroundRepeat = 'no-repeat'
        COLORS.background = 'rgb(40,44,52)'
      } else {
        // Switch to light theme
        toggleTheme.style.background = `url('./assets/sun1.png')`
        toggleTheme.style.backgroundRepeat = 'no-repeat'
        COLORS.background = 'rgb(255,255,255)'
      }
      this.canvas.clear()
      this.canvas.drawPoints({
        cPoints: this.canvas.getPointStateTimeline(),
        thickness: this.thickness,
        movedLinesMapping: []
      })
      saveCanvasData({
        canvas: this.canvas,
        pagePointStates: this.pagePointStates,
        currentPageIndex: this.currentPageIndex,
        totalPages: this.totalPages
      })
    })
  }
}

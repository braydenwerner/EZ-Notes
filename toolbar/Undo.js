import { saveCanvasData } from '../autosave.js'

export default class Undo {
  constructor({
    getCanvas,
    getPagePointStates,
    getCurrentPageIndex,
    getTotalPages,
    getThickness,
    resetToolbarState
  }) {
    this.getCanvas = getCanvas
    this.getPagePointStates = getPagePointStates
    this.getCurrentPageIndex = getCurrentPageIndex
    this.getTotalPages = getTotalPages
    this.getThickness = getThickness
    this.resetToolbarState = resetToolbarState

    document.getElementById('undo').addEventListener('click', () => this.undo())
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') {
        this.undo()
      }
    })
  }

  undo() {
    this.resetToolbarState()

    this.getCanvas().undo(this.getThickness())
    saveCanvasData({
      canvas: this.getCanvas(),
      pagePointStates: this.getPagePointStates(),
      currentPageIndex: this.getCurrentPageIndex(),
      totalPages: this.getTotalPages()
    })
  }
}

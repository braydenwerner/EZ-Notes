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
    document.getElementById('undo').addEventListener('click', () => {
      resetToolbarState()

      getCanvas().undo(getThickness())
      saveCanvasData({
        canvas: getCanvas(),
        pagePointStates: getPagePointStates(),
        currentPageIndex: getCurrentPageIndex(),
        totalPages: getTotalPages()
      })
    })
  }
}

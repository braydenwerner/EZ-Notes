import { saveCanvasData } from '../autosave.js'
export default class Pagination {
  constructor({
    getCanvas,
    getPagePointStates,
    getCurrentPageIndex,
    getTotalPages,
    getThickness,
    getPageNumber,
    getCurrentPageNum,
    resetToolbarState,
    setSelectedLines
  }) {
    this.canvas = getCanvas()
    this.pagePointStates = getPagePointStates()
    this.currentPageIndex = getCurrentPageIndex()
    this.totalPages = getTotalPages()
    this.thickness = getThickness()
    this.pageNumber = getPageNumber()
    this.currentPageNum = getCurrentPageNum()

    document.getElementById('previous-page').addEventListener('click', () => {
      resetToolbarState()

      if (this.currentPageIndex === 0) return

      this.canvas.clear()
      this.pagePointStates[this.currentPageIndex] = [
        ...this.canvas.getPointStateTimeline()
      ]
      this.currentPageIndex--

      this.canvas.drawPoints({
        cPoints: this.pagePointStates[this.currentPageIndex],
        thickness: this.thickness,
        movedLinesMapping: []
      })
      this.currentPageNum--
      this.pageNumber.innerText = `${this.currentPageNum} of ${this.totalPages}`
      saveCanvasData({
        canvas: this.canvas,
        pagePointStates: this.pagePointStates,
        currentPageIndex: this.currentPageIndex,
        totalPages: this.totalPages
      })

      setSelectedLines([])
    })

    document.getElementById('next-page').addEventListener('click', () => {
      resetToolbarState()

      this.canvas.clear()
      this.pagePointStates[this.currentPageIndex] = [
        ...this.canvas.getPointStateTimeline()
      ]
      this.currentPageIndex++

      if (this.pagePointStates[this.currentPageIndex]) {
        this.canvas.drawPoints({
          cPoints: this.pagePointStates[this.currentPageIndex],
          thickness: this.thickness,
          movedLinesMapping: []
        })
        this.canvas.setPointStateTimeline(
          this.pagePointStates[this.currentPageIndex]
        )
      } else {
        this.totalPages++
        this.canvas.setPointStateTimeline([])
      }
      this.currentPageNum++
      this.pageNumber.innerText = `${this.currentPageNum} of ${this.totalPages}`
      saveCanvasData({
        canvas: this.canvas,
        pagePointStates: this.pagePointStates,
        currentPageIndex: this.currentPageIndex,
        totalPages: this.totalPages
      })

      setSelectedLines([])
    })
  }
}

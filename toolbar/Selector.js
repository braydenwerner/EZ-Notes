export default class Selector {
  constructor({
    resetToolbarState,
    setUsingSelectorTool,
    getSelectorStartPoint,
    getSelectorEndPoint,
    getCanvas,
    getMovedLinesMapping,
    getSelectedLines,
    setSelectedDimensions
  }) {
    this.canvas = getCanvas()
    this.getSelectorStartPoint = getSelectorStartPoint
    this.getSelectorEndPoint = getSelectorEndPoint
    this.getMovedLinesMapping = getMovedLinesMapping
    this.getSelectedLines = getSelectedLines
    this.setSelectedDimensions = setSelectedDimensions

    document.getElementById('selector').addEventListener('click', () => {
      resetToolbarState()
      setUsingSelectorTool(true)
    })
  }

  handleSelector() {
    this.minSelectedX = Math.min(
      Math.min(this.getSelectorStartPoint().x, this.getSelectorEndPoint().x)
    )
    this.maxSelectedX = Math.max(
      Math.max(this.getSelectorStartPoint().x, this.getSelectorEndPoint().x)
    )
    this.minSelectedY = Math.min(
      Math.min(this.getSelectorStartPoint().y, this.getSelectorEndPoint().y)
    )
    this.maxSelectedY = Math.max(
      Math.max(this.getSelectorStartPoint().y, this.getSelectorEndPoint().y)
    )

    this.setSelectedDimensions(
      this.minSelectedX,
      this.maxSelectedX,
      this.minSelectedY,
      this.maxSelectedY
    )

    // Save all points in the selected area
    let numSelectionsCount = 0
    for (let i = 0; i < this.canvas.getPointStateTimeline().length; i++) {
      for (let point of this.canvas.getPointStateTimeline()[i]) {
        if (
          point.x >= this.minSelectedX &&
          point.x <= this.maxSelectedX &&
          point.y >= this.minSelectedY &&
          point.y <= this.maxSelectedY
        ) {
          // If a line contains points in the selected area, add it to selectedLines array
          // We must check if selectedLines already contains canvasPointStates[i], otherwise there will be an error
          // Where there are duplicate lines, causing selectedLines size to double with each selection
          if (
            !this.getSelectedLines().some(
              (line) =>
                JSON.stringify(line) ===
                JSON.stringify(this.canvas.getPointStateTimeline()[i])
            )
          ) {
            this.getSelectedLines().push([
              ...this.canvas.getPointStateTimeline()[i]
            ])
          }
          this.getMovedLinesMapping().push({
            originalLine: i,
            movedLine:
              this.canvas.getPointStateTimeline().length + numSelectionsCount
          })
          numSelectionsCount++
          break // Currently if any pixel touches the selected area
        }
      }
    }
  }
}

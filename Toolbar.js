export default class Toolbar {
  constructor() {
    this.element = document.getElementById('toolbar')
    this.colorPickerButton = document.getElementById('color-picker-button')
    this.colorPickerContainer = document.getElementById(
      'color-picker-container'
    )
    this.colorPickerContainer.style.width = '285px'
    this.colorPickerContainer.style.height = '68px'

    this.initDimensions()

    this.isColorPickerPopUpHidden = true

    this.colorPickerButton.addEventListener('click', () => {
      this.isColorPickerPopUpHidden = !this.isColorPickerPopUpHidden

      if (this.isColorPickerPopUpHidden)
        this.colorPickerContainer.style.display = 'none'
      else this.colorPickerContainer.style.display = 'inherit'
    })

    // Don't want to draw behind the container, so can undo drawn lines
    this.colorPickerContainer.addEventListener('click', () => {})
  }

  initDimensions() {
    // Drawing is not allowed in the toolbar area
    this.minX = this.element.offsetLeft - this.element.offsetWidth / 2
    this.maxX = this.element.offsetLeft + this.element.offsetWidth / 2
    // 20 is the top margin of the toolbar
    this.minY = this.element.offsetTop - this.element.offsetHeight / 2 + 20
    this.maxY = this.element.offsetTop + this.element.offsetHeight / 2 + 20

    this.popUpMinX = this.minX
    this.popUpMaxX = this.minX + 285
    this.popUpMinY = 83
    this.popUpMaxY = 83 + 68

    this.colorPickerContainer.style.left = this.minX + 'px'
  }

  isIntersectingToolbarElements(x, y) {
    return (
      (y >= this.minY && y <= this.maxY && x >= this.minX && x <= this.maxX) ||
      (!this.isColorPickerPopUpHidden &&
        y >= this.popUpMinY &&
        y <= this.popUpMaxY &&
        x >= this.popUpMinX &&
        x <= this.popUpMaxX)
    )
  }

  handleCloseColorPickerPopUp(x, y) {
    if (
      !this.isColorPickerPopUpHidden &&
      !(
        y >= this.popUpMinY &&
        y <= this.popUpMaxY &&
        x >= this.popUpMinX &&
        x <= this.popUpMaxX
      )
    ) {
      this.setIsColorPickerPopUpHidden(true)
      this.colorPickerContainer.style.display = 'none'
    }
  }

  getOffsetHeight() {
    return this.element.offsetHeight
  }

  getOffsetWidth() {
    return this.element.offsetWidth
  }

  getOffsetLeft() {
    return this.element.offsetLeft
  }

  getOffsetTop() {
    return this.element.offsetTop
  }

  getMinX() {
    return this.minX
  }

  getMaxX() {
    return this.maxX
  }

  getMinY() {
    return this.minY
  }

  getMaxY() {
    return this.maxY
  }

  getIsColorPickerPopUpHidden() {
    return this.isColorPickerPopUpHidden
  }

  setIsColorPickerPopUpHidden(isColorPickerPopUpHidden) {
    this.isColorPickerPopUpHidden = isColorPickerPopUpHidden
  }
}

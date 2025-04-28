export default class Toolbar {
  constructor() {
    this.element = document.getElementById('toolbar')
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
}

export default class SliderEraser {
  constructor({ ctx, getUsingEraser, setEraserThickness }) {
    this.customEraserCursor = document.getElementById('custom-eraser-cursor')
    this.slider = document.getElementById('slider-eraser')

    this.customEraserCursor.style.width = this.slider.value
    this.customEraserCursor.style.height = this.slider.value

    setEraserThickness(this.slider.value)

    this.slider.addEventListener('input', () => {
      const thickness = this.slider.value
      if (getUsingEraser()) {
        ctx.lineWidth = thickness
      }
      this.customEraserCursor.style.width = thickness
      this.customEraserCursor.style.height = thickness
      setEraserThickness(thickness)
    })
  }
}

export default class SliderPen {
  constructor({ ctx, getUsingEraser, setThickness }) {
    this.slider = document.getElementById('slider-pen')

    setThickness(this.slider.value)

    this.slider.addEventListener('input', () => {
      const thickness = this.slider.value
      if (!getUsingEraser()) {
        ctx.lineWidth = thickness
      }
      setThickness(thickness)
    })
  }
}

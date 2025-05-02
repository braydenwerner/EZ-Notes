export default class Eraser {
  constructor({
    setUsingEraser,
    getCustomEraserCursor,
    getEraserThickness,
    resetToolbarState
  }) {
    document.getElementById('eraser').addEventListener('click', (e) => {
      resetToolbarState()

      setUsingEraser(true)

      const customEraserCursor = getCustomEraserCursor()
      customEraserCursor.style.display = 'initial'
      customEraserCursor.style.left = `${
        e.clientX - getEraserThickness() / 2
      }px`
      customEraserCursor.style.top = `${e.clientY - getEraserThickness() / 2}px`
    })
  }
}

import { COLORS } from '../config.js'

export default class PenColors {
  constructor({
    getIsPenLocked,
    getPreviousButton,
    setSelectedColor,
    setPreviousButton,
    resetToolbarState
  }) {
    this.colors = document.querySelectorAll('button[id^="pen-"]')

    this.colors.forEach((colorButton) => {
      colorButton.addEventListener('click', () => {
        // When screen is locked, shouldn't be able to do anything except unlock screen
        if (getIsPenLocked()) return

        resetToolbarState()

        const previousButton = getPreviousButton()

        // Format of id: pen-[COLOR] or pen-custom
        // Reset previous button color
        if (previousButton) {
          previousButton.style.backgroundColor =
            COLORS[previousButton.id.split('-')[1]] ?? COLORS.customColor
        }

        // Set color button color
        colorButton.style.backgroundColor =
          COLORS[
            'dark' +
              colorButton.id.split('-')[1]?.charAt(0).toUpperCase() +
              colorButton.id.split('-')[1]?.slice(1)
          ] ?? COLORS.customColor

        setSelectedColor(
          COLORS[colorButton.id.split('-')[1]] ?? COLORS.customColor
        )

        setPreviousButton(colorButton)
      })
    })
  }
}

//  stores global variables used in multiple files
export const colors = {
  background: 'rgb(40,44,52)',
  purple: 'rgb(198,120,221)',
  red: 'rgb(224, 108, 117)',
  green: 'rgb(152, 195, 121)',
  blue: ' rgb(0, 194, 182)',
  yellow: 'rgb(229, 192, 123)'
}

export let currentColor = colors.purple
export const setCurrentColor = (c) => {
  currentColor = c
}

export let thickness = 4
export const setThickness = (t) => {
  thickness = t
}

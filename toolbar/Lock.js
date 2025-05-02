export default class Lock {
  constructor({ getIsPenLocked, setIsPenLocked }) {
    const lock = document.getElementById('lock')

    lock.addEventListener('click', () => {
      setIsPenLocked(!getIsPenLocked())

      if (getIsPenLocked()) {
        lock.style.background = `url('./assets/padlock.png')`
        lock.style.backgroundRepeat = 'no-repeat'
      } else {
        lock.style.background = `url('./assets/open-padlock.png')`
        lock.style.backgroundRepeat = 'no-repeat'
      }
    })
  }
}

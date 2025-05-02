export default class Reset {
  constructor({ getCanvas, resetToolbarState }) {
    document.getElementById('reset').addEventListener('click', () => {
      resetToolbarState()

      getCanvas().setPointStateTimeline([])
      getCanvas().clear()
      // Clear saved data
      localStorage.removeItem('ez-notes-data')
      // Clear all data block cookies
      for (let i = 0; i <= 20; i++) {
        document.cookie = `ez_data_${i}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
      document.cookie = `ez_data_chunks=0; path=/; max-age=31536000`
    })
  }
}

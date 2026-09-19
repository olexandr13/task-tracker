/**
 * Hands the browser a file to save under `name`, as if a link to it had been
 * followed. Nothing leaves the device: the file is made here, from `text`.
 */
export function downloadFile(name: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  // Let go on the next turn rather than at once: a browser may only start the
  // download after the click has returned.
  setTimeout(() => { URL.revokeObjectURL(url) }, 0)
}

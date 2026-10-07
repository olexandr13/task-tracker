/**
 * Windows-1252 bytes 0x80–0x9F, in order. Every other byte below 0x100 reads as
 * the character with the same code; the five bytes Windows-1252 leaves
 * undefined read as their C1 control, as browsers decode them.
 */
const WINDOWS_1252_HIGH =
  '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F' +
  '\u0090‘’“”•–—˜™š›œ\u009DžŸ'

const utf8 = new TextDecoder('utf-8', { fatal: true })

/** The byte Windows-1252 writes `char` as, or null if it has none. */
function windows1252Byte(char: string): number | null {
  const code = char.charCodeAt(0)
  if (code < 0x80 || (code >= 0xa0 && code <= 0xff)) return code
  const index = WINDOWS_1252_HIGH.indexOf(char)
  return index === -1 ? null : 0x80 + index
}

/** One run of non-ASCII characters, read back as the UTF-8 it was, if it was. */
function repairRun(run: string): string {
  const bytes: number[] = []
  for (const char of run) {
    const byte = windows1252Byte(char)
    // A character Windows-1252 can't write never passed through it.
    if (byte === null) return run
    bytes.push(byte)
  }
  try {
    return utf8.decode(new Uint8Array(bytes))
  } catch {
    // Not UTF-8 underneath: the accents are real ("café" stays "café").
    return run
  }
}

/**
 * Undoes text that was UTF-8 but got read as Windows-1252 somewhere upstream,
 * so "…" turned into "â€¦" and "’" into "â€™".
 *
 * Each run of non-ASCII characters is repaired on its own, so one garbled
 * ellipsis is fixed even beside a dash that was always right. Text that is
 * already fine comes back unchanged.
 */
export function repairMojibake(text: string): string {
  return text.replace(/[\u0080-￿]+/g, repairRun)
}

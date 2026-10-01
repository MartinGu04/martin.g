/** True when the text contains Hebrew letters. */
export function isHebrew(text: string): boolean {
  return /[֐-׿]/.test(text)
}

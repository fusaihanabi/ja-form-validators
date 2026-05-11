export function isPostalCodeJP(value: string): boolean {
  return /^\d{3}-?\d{4}$/.test(value)
}

export function isMobilePhoneJP(value: string): boolean {
  return /^(070|080|090)-?\d{4}-?\d{4}$/.test(value)
}

export function isPhoneNumberJP(value: string): boolean {
  return /^(0\d{1,4}-?\d{1,4}-?\d{4}|0\d{9,10})$/.test(value)
}

export function isKatakana(value: string): boolean {
  return /^[ァ-ヶー・\s　]+$/.test(value)
}

export function isZenkaku(value: string): boolean {
  return value.length > 0 && !/[ -~]/.test(value)
}
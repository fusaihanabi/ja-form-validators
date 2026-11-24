import { landlineAreaCodeRules, landlineNumberPattern } from "./landline-metadata.js"

export function isPostalCodeJP(value: string): boolean {
  return /^\d{3}-?\d{4}$/.test(value)
}

export function isMobilePhoneJP(value: string): boolean {
  return /^(070|080|090)-?\d{4}-?\d{4}$/.test(value)
}

export function isPhoneNumberJP(value: string): boolean {
  return /^(0\d{1,4}-?\d{1,4}-?\d{4}|0\d{9,10})$/.test(value)
}

export function isLandlinePhoneJP(value: string): boolean {
  const match = /^(0\d{1,4})(-?)(\d{1,4})\2(\d{4})$/.exec(value)
  if (!match) return false

  const [, area, separator, exchange, subscriber] = match
  const nationalNumber = area.slice(1) + exchange + subscriber
  if (!landlineNumberPattern.test(nationalNumber)) return false

  const rule = landlineAreaCodeRules.find(([leadingDigits]) => leadingDigits.test(nationalNumber))
  return rule !== undefined && (separator === "" || area.length === rule[1])
}

export type PhoneNumberKind = "landline" | "mobile" | "ip" | "tollFree"

const strictPhoneValidators: Record<PhoneNumberKind, (value: string) => boolean> = {
  landline: isLandlinePhoneJP,
  mobile: (value) => /^(?:070|080|090)(-?)\d{4}\1\d{4}$/.test(value),
  ip: (value) => /^050(-?)\d{4}\1\d{4}$/.test(value),
  tollFree: (value) =>
    /^0120(-?)\d{3}\1\d{3}$/.test(value) || /^0800(-?)\d{3}\1\d{4}$/.test(value),
}
const defaultPhoneNumberKinds: readonly PhoneNumberKind[] = ["mobile", "ip", "tollFree"]

export function isStrictPhoneNumberJP(
  value: string,
  { kinds = defaultPhoneNumberKinds }: { kinds?: readonly PhoneNumberKind[] } = {},
): boolean {
  return kinds.some((kind) => strictPhoneValidators[kind](value))
}

export function isKatakana(value: string): boolean {
  return /^[ァ-ヶー・\s　]+$/.test(value)
}

export function isFurigana(value: string): boolean {
  return /^[ァ-ヶー・ 　]+$/.test(value) && /[ァ-ヶ]/.test(value)
}

export function isZenkaku(value: string): boolean {
  return value.length > 0 && !/[ -~]/.test(value)
}

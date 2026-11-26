import { landlineAreaCodeRules, landlineNumberPattern } from "./landline-metadata.js"

export type PostalCodeFailureReason =
  | "empty"
  | "invalid_character"
  | "invalid_length"
  | "invalid_separator"

export type PostalCodeResult =
  | { ok: true }
  | { ok: false; reason: PostalCodeFailureReason }

export function validatePostalCodeJP(value: string): PostalCodeResult {
  if (value === "") return { ok: false, reason: "empty" }
  if (/[^0-9-]/.test(value)) return { ok: false, reason: "invalid_character" }
  if (!/^(?:-*[0-9]){7}-*$/.test(value)) return { ok: false, reason: "invalid_length" }
  if (!/^\d{3}-?\d{4}$/.test(value)) return { ok: false, reason: "invalid_separator" }
  return { ok: true }
}

export function isPostalCodeJP(value: string): boolean {
  return validatePostalCodeJP(value).ok
}

// MIC Notice No. 441 of 2024 excludes 060 numbers whose fourth digit is 0.
const mobilePhonePrefix = "(?:060(?=-?[1-9])|070|080|090)"
const mobilePhonePattern = new RegExp(String.raw`^${mobilePhonePrefix}-?\d{4}-?\d{4}$`)
const strictMobilePhonePattern = new RegExp(String.raw`^${mobilePhonePrefix}(-?)\d{4}\1\d{4}$`)

export function isMobilePhoneJP(value: string): boolean {
  return mobilePhonePattern.test(value)
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
export type PhoneNumberFormat = "domestic" | "international" | "either"
export type PhoneNumberKindMatching = "compatible" | "specific"

export interface StrictPhoneNumberOptions {
  kinds?: readonly PhoneNumberKind[]
  format?: PhoneNumberFormat
  kindMatching?: PhoneNumberKindMatching
}

export type StrictPhoneNumberFailureReason =
  | "empty"
  | "invalid_format"
  | "kind_not_allowed"
  | "format_not_allowed"

export type StrictPhoneNumberResult =
  | { ok: true; kind: PhoneNumberKind; format: Exclude<PhoneNumberFormat, "either"> }
  | { ok: false; reason: StrictPhoneNumberFailureReason }

const strictPhoneValidators: Record<PhoneNumberKind, (value: string) => boolean> = {
  landline: isLandlinePhoneJP,
  mobile: (value) => strictMobilePhonePattern.test(value),
  ip: (value) => /^050(-?)\d{4}\1\d{4}$/.test(value),
  tollFree: (value) =>
    /^0120(-?)\d{3}\1\d{3}$/.test(value) || /^0800(-?)\d{3}\1\d{4}$/.test(value),
}
// Unhyphenated 0800 numbers can match both domestic formats. Prefer the longer prefix.
const defaultPhoneNumberKinds: readonly PhoneNumberKind[] = ["tollFree", "mobile", "ip"]
const domesticPhoneNumberKinds: readonly PhoneNumberKind[] = [...defaultPhoneNumberKinds, "landline"]
const internationalPhoneNumberKinds: readonly PhoneNumberKind[] = ["mobile", "landline"]

function toDomesticPhoneNumber(value: string): string | undefined {
  // Require the same separator after +81 and between the national groups.
  const match = /^\+81(-?)([1-9]\d{0,3})\1(\d{1,4})\1(\d{4})$/.exec(value)
  if (!match) return undefined

  const [, separator, area, exchange, subscriber] = match
  return ["0" + area, exchange, subscriber].join(separator)
}

function matchingPhoneNumberKinds(
  domesticNumber: string,
  possibleKinds: readonly PhoneNumberKind[],
  kindMatching: PhoneNumberKindMatching,
): PhoneNumberKind[] {
  if (kindMatching === "specific") {
    const digits = domesticNumber.replace(/-/g, "")
    const kind = domesticPhoneNumberKinds.find((candidate) => strictPhoneValidators[candidate](digits))
    if (kind === undefined || !possibleKinds.includes(kind) || !strictPhoneValidators[kind](domesticNumber)) {
      return []
    }
    return [kind]
  }

  return possibleKinds.filter((kind) => strictPhoneValidators[kind](domesticNumber))
}

export function validateStrictPhoneNumberJP(
  value: string,
  {
    kinds = defaultPhoneNumberKinds,
    format = "domestic",
    kindMatching = "specific",
  }: StrictPhoneNumberOptions = {},
): StrictPhoneNumberResult {
  if (value === "") return { ok: false, reason: "empty" }

  const inputFormat = value.startsWith("+") ? "international" : "domestic"
  const domesticNumber = inputFormat === "international" ? toDomesticPhoneNumber(value) : value
  if (domesticNumber === undefined) return { ok: false, reason: "invalid_format" }

  const possibleKinds =
    inputFormat === "international" ? internationalPhoneNumberKinds : domesticPhoneNumberKinds
  const matchingKinds = matchingPhoneNumberKinds(domesticNumber, possibleKinds, kindMatching)
  if (matchingKinds.length === 0) return { ok: false, reason: "invalid_format" }

  const kind = matchingKinds.find((candidate) => kinds.includes(candidate))
  if (kind === undefined) return { ok: false, reason: "kind_not_allowed" }
  if (format !== "either" && format !== inputFormat) return { ok: false, reason: "format_not_allowed" }

  return { ok: true, kind, format: inputFormat }
}

export function isStrictPhoneNumberJP(
  value: string,
  options: StrictPhoneNumberOptions = {},
): boolean {
  return validateStrictPhoneNumberJP(value, options).ok
}

export function isKatakana(value: string): boolean {
  return /^[ァ-ヶー・\s　]+$/.test(value)
}

export type FuriganaFailureReason = "empty" | "invalid_character" | "missing_katakana"

export type FuriganaResult =
  | { ok: true }
  | { ok: false; reason: FuriganaFailureReason }

export function validateFurigana(value: string): FuriganaResult {
  if (value === "") return { ok: false, reason: "empty" }
  if (!/^[ァ-ヶー・ 　]+$/.test(value)) return { ok: false, reason: "invalid_character" }
  if (!/[ァ-ヶ]/.test(value)) return { ok: false, reason: "missing_katakana" }
  return { ok: true }
}

export function isFurigana(value: string): boolean {
  return validateFurigana(value).ok
}

export interface ZenkakuOptions<RejectControlCharacters extends boolean = false> {
  rejectHalfwidthKana?: boolean
  rejectControlCharacters?: RejectControlCharacters
}

export type ZenkakuFailureReason<RejectControlCharacters extends boolean = false> =
  | "empty"
  | "printable_ascii"
  | "halfwidth_kana"
  | (true extends RejectControlCharacters ? "control_character" : never)

export type ZenkakuResult<RejectControlCharacters extends boolean = false> =
  | { ok: true }
  | { ok: false; reason: ZenkakuFailureReason<RejectControlCharacters> }

export function validateZenkaku<RejectControlCharacters extends boolean = false>(
  value: string,
  options?: ZenkakuOptions<RejectControlCharacters>,
): ZenkakuResult<RejectControlCharacters>
// Keep the default result type for existing consumers of ReturnType<typeof validateZenkaku>.
export function validateZenkaku(value: string, options?: ZenkakuOptions): ZenkakuResult
export function validateZenkaku(
  value: string,
  { rejectHalfwidthKana = false, rejectControlCharacters = false }: ZenkakuOptions<boolean> = {},
): ZenkakuResult<boolean> {
  if (value.length === 0) return { ok: false, reason: "empty" }
  if (/[ -~]/.test(value)) return { ok: false, reason: "printable_ascii" }
  if (rejectHalfwidthKana && /[\uFF66-\uFF9F]/.test(value)) {
    return { ok: false, reason: "halfwidth_kana" }
  }
  if (rejectControlCharacters && /[\u0000-\u001F\u007F-\u009F]/.test(value)) {
    return { ok: false, reason: "control_character" }
  }
  return { ok: true }
}

export function isZenkaku(value: string, options?: ZenkakuOptions<boolean>): boolean {
  return validateZenkaku(value, options).ok
}

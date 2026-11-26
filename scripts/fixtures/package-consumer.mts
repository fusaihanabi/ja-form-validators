import {
  isFurigana,
  isMobilePhoneJP,
  isZenkaku,
  validateFurigana,
  validatePostalCodeJP,
  validateStrictPhoneNumberJP,
  validateZenkaku,
  type FuriganaFailureReason,
  type FuriganaOptions,
  type PhoneNumberKindMatching,
  type PostalCodeFailureReason,
  type PostalCodeResult,
  type PostalCodeValidationOptions,
  type StrictPhoneNumberFailureReason,
  type StrictPhoneNumberOptions,
  type ZenkakuFailureReason,
  type ZenkakuOptions,
  type ZenkakuResult,
  type ZenkakuValidationOptions,
} from "ja-form-validators"

const phoneOptions: StrictPhoneNumberOptions = { kinds: ["landline", "mobile"], format: "either" }
const postalCode = validatePostalCodeJP("150-0001")
const phone = validateStrictPhoneNumberJP("+81-3-1234-5678", phoneOptions)
const furigana = validateFurigana("タナカ タロウ")

// @ts-expect-error The failure reason is available only after checking ok.
void postalCode.reason

if (!postalCode.ok || !furigana.ok || !phone.ok) throw new Error("Expected all three fields to pass")
if (phone.kind !== "landline" || phone.format !== "international") {
  throw new Error("Expected an international landline")
}

const invalidPostalCode = validatePostalCodeJP("150-001")
const invalidPhone = validateStrictPhoneNumberJP("050-1234-5678", phoneOptions)
const invalidFurigana = validateFurigana("ﾀﾅｶ")

if (invalidPostalCode.ok || invalidPhone.ok || invalidFurigana.ok) {
  throw new Error("Expected all three fields to fail")
}

const postalReason: PostalCodeFailureReason = invalidPostalCode.reason
const phoneReason: StrictPhoneNumberFailureReason = invalidPhone.reason
const furiganaReason: FuriganaFailureReason = invalidFurigana.reason
if (postalReason !== "invalid_length" || phoneReason !== "kind_not_allowed" || furiganaReason !== "invalid_character") {
  throw new Error("Unexpected field validation reasons")
}

const postalOptions = { includeDetails: true } as const satisfies PostalCodeValidationOptions
const shortPostalCode: PostalCodeResult<true> = validatePostalCodeJP("150-001", postalOptions)
if (shortPostalCode.ok || shortPostalCode.reason !== "invalid_length" || shortPostalCode.digitCount !== 6) {
  throw new Error("Expected the postal code digit count")
}

const invalidPostalCharacter = validatePostalCodeJP("150🙂0001", postalOptions)
if (invalidPostalCharacter.ok || invalidPostalCharacter.reason !== "invalid_character"
    || invalidPostalCharacter.index !== 3 || invalidPostalCharacter.character !== "🙂") {
  throw new Error("Expected the postal code character and its position")
}

const postalWithoutDetails: ReturnType<typeof validatePostalCodeJP> = validatePostalCodeJP("150-001")
if (postalWithoutDetails.ok || postalWithoutDetails.reason !== "invalid_length" || "digitCount" in postalWithoutDetails) {
  throw new Error("Expected the legacy postal code result shape")
}

function checkPostalDetails(includeDetails: boolean) {
  const options: PostalCodeValidationOptions = { includeDetails }
  const result = validatePostalCodeJP("150--0001", options)
  if (result.ok || ("index" in result) !== includeDetails) {
    throw new Error("Expected postal code details to follow the provided option")
  }
  if ("index" in result && result.index !== 4) throw new Error("Expected the second hyphen position")
}

checkPostalDetails(false)
checkPostalDetails(true)

const furiganaOptions: FuriganaOptions = { normalization: "NFC" }
const kanaWithCombiningMark = "カ\u3099"
if (!validateFurigana(kanaWithCombiningMark, furiganaOptions).ok || !isFurigana(kanaWithCombiningMark, furiganaOptions)) {
  throw new Error("Expected both furigana validators to accept the combining mark with NFC")
}
if (validateFurigana(kanaWithCombiningMark).ok || isFurigana(kanaWithCombiningMark)) {
  throw new Error("Expected the default furigana validators to keep the original behavior")
}

const mobileOnly = { kinds: ["mobile"] } as const
const tollFreeInMobileField = validateStrictPhoneNumberJP("08001234567", mobileOnly)
if (tollFreeInMobileField.ok || tollFreeInMobileField.reason !== "kind_not_allowed") {
  throw new Error("Expected the default matching to reject an 0800 number in a mobile field")
}

const kindMatching: PhoneNumberKindMatching = "compatible"
const compatibleResult = validateStrictPhoneNumberJP("08001234567", { ...mobileOnly, kindMatching })
if (!compatibleResult.ok || compatibleResult.kind !== "mobile") {
  throw new Error("Expected compatible matching to retain the previous mobile match")
}

const mobile060 = validateStrictPhoneNumberJP("+81-60-1234-5678", phoneOptions)
if (!isMobilePhoneJP("060-1234-5678") || !mobile060.ok || mobile060.kind !== "mobile") {
  throw new Error("Expected 060 support in domestic and international forms")
}
if (isMobilePhoneJP("060-0234-5678")) throw new Error("Expected 060-0 to be excluded")

const zenkakuOptions: ZenkakuOptions = { rejectHalfwidthKana: true }
const halfwidthKana: ZenkakuResult = validateZenkaku("ﾀﾅｶ", zenkakuOptions)
if (halfwidthKana.ok) throw new Error("Expected halfwidth kana to be rejected by the option")
const zenkakuReason: ZenkakuFailureReason = halfwidthKana.reason
type LegacyZenkakuResult = ReturnType<typeof validateZenkaku>
const legacyZenkakuMessages: Record<Extract<LegacyZenkakuResult, { ok: false }>["reason"], string> = {
  empty: "Enter a value",
  printable_ascii: "Enter fullwidth text",
  halfwidth_kana: "Enter fullwidth kana",
}
if (zenkakuReason !== "halfwidth_kana" || isZenkaku("ﾀﾅｶ", zenkakuOptions) || !isZenkaku("ﾀﾅｶ")) {
  throw new Error("Unexpected result for the halfwidth kana option")
}
if (legacyZenkakuMessages[zenkakuReason] !== "Enter fullwidth kana") {
  throw new Error("Expected the legacy reason to select a message")
}

const defaultZenkaku: ZenkakuResult = validateZenkaku("山田\t太郎")
const controlsAllowed: ZenkakuResult = validateZenkaku("山田\t太郎", { rejectControlCharacters: false })
if (!defaultZenkaku.ok || !controlsAllowed.ok) {
  throw new Error("Expected legacy matching to allow control characters")
}

const controlsRejected = validateZenkaku("山田\t太郎", { rejectControlCharacters: true })
if (controlsRejected.ok || controlsRejected.reason !== "control_character") {
  throw new Error("Expected control character rejection when enabled")
}

function checkControlOption(rejectControlCharacters: boolean) {
  const options: ZenkakuOptions<boolean> = { rejectControlCharacters }
  const result = validateZenkaku("山田\n太郎", options)
  const expectedOk = !rejectControlCharacters
  if (result.ok !== expectedOk || (!result.ok && result.reason !== "control_character")) {
    throw new Error("Expected control character rejection to follow the provided option")
  }
  if (isZenkaku("山田\n太郎", options) !== result.ok) throw new Error("Expected the validators to agree")
}

checkControlOption(false)
checkControlOption(true)

const detailedOptions = {
  includeInvalidCharacter: true,
  rejectControlCharacters: true,
} as const satisfies ZenkakuValidationOptions<true>
const detailedResult: ZenkakuResult<true, true> = validateZenkaku("🙂\t山田", detailedOptions)
if (detailedResult.ok || detailedResult.reason === "empty") throw new Error("Expected details for a control character")
if (detailedResult.reason !== "control_character" || detailedResult.index !== 2 || detailedResult.character !== "\t") {
  throw new Error("Unexpected invalid character details")
}

const withoutDetails: ZenkakuResult<true> = validateZenkaku("山田\t", {
  rejectControlCharacters: true,
  includeInvalidCharacter: false,
})
if (withoutDetails.ok || "index" in withoutDetails) throw new Error("Expected a failure reason without details")

function checkDynamicDetails(includeInvalidCharacter: boolean) {
  const options: ZenkakuValidationOptions = { includeInvalidCharacter }
  const result = validateZenkaku("山田Taro", options)
  if (result.ok || ("index" in result) !== includeInvalidCharacter) {
    throw new Error("Expected details to follow the provided option")
  }
  if ("index" in result && result.index !== 2) throw new Error("Expected the first ASCII character position")
}

checkDynamicDetails(false)
checkDynamicDetails(true)

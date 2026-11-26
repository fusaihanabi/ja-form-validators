import {
  isMobilePhoneJP,
  validateFurigana,
  validatePostalCodeJP,
  validateStrictPhoneNumberJP,
  type FuriganaFailureReason,
  type PhoneNumberKindMatching,
  type PostalCodeFailureReason,
  type StrictPhoneNumberFailureReason,
  type StrictPhoneNumberOptions,
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

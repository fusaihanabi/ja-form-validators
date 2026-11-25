import { describe, expect, it } from "vitest"
import {
  isFurigana,
  isKatakana,
  isLandlinePhoneJP,
  isMobilePhoneJP,
  isPhoneNumberJP,
  isPostalCodeJP,
  isStrictPhoneNumberJP,
  isZenkaku,
  validateFurigana,
  validatePostalCodeJP,
  validateStrictPhoneNumberJP,
} from "../src/index.ts"

describe("isPostalCodeJP", () => {
  it("returns true for valid Japanese postal codes", () => {
    expect(isPostalCodeJP("150-0001")).toBe(true)
    expect(isPostalCodeJP("1500001")).toBe(true)
  })

  it("returns false for invalid Japanese postal codes", () => {
    expect(isPostalCodeJP("150-000")).toBe(false)
    expect(isPostalCodeJP("１５０-０００１")).toBe(false)
    expect(isPostalCodeJP("abc-defg")).toBe(false)
  })
})

describe("validatePostalCodeJP", () => {
  it.each(["150-0001", "1500001", "060-0001"])("accepts %s", (value) => {
    const result = validatePostalCodeJP(value)
    expect(result).toEqual({ ok: true })
    expect(isPostalCodeJP(value)).toBe(result.ok)
  })

  it.each([
    ["", "empty"],
    [" ", "invalid_character"],
    ["１５０-０００１", "invalid_character"],
    ["１５０-０１", "invalid_character"],
    ["150−0001", "invalid_character"],
    ["150-0001\n", "invalid_character"],
    ["150x001", "invalid_character"],
    ["-", "invalid_length"],
    ["150001", "invalid_length"],
    ["15000001", "invalid_length"],
    ["15-001", "invalid_length"],
    ["15--001", "invalid_length"],
    ["15-00001", "invalid_separator"],
    ["15--00001", "invalid_separator"],
    ["150--0001", "invalid_separator"],
    ["-1500001", "invalid_separator"],
    ["1500001-", "invalid_separator"],
  ] as const)("reports why %j was rejected", (value, reason) => {
    const result = validatePostalCodeJP(value)
    expect(result).toEqual({ ok: false, reason })
    expect(isPostalCodeJP(value)).toBe(result.ok)
  })
})

describe("isMobilePhoneJP", () => {
  it("returns true for valid Japanese mobile phone numbers", () => {
    expect(isMobilePhoneJP("090-1234-5678")).toBe(true)
    expect(isMobilePhoneJP("08012345678")).toBe(true)
    expect(isMobilePhoneJP("070-1234-5678")).toBe(true)
    expect(isMobilePhoneJP("090-12345678")).toBe(true)
  })

  it("returns false for invalid Japanese mobile phone numbers", () => {
    expect(isMobilePhoneJP("03-1234-5678")).toBe(false)
    expect(isMobilePhoneJP("050-1234-5678")).toBe(false)
    expect(isMobilePhoneJP("０９０-１２３４-５６７８")).toBe(false)
  })
})

describe("isPhoneNumberJP", () => {
  it("returns true for valid Japanese phone-like numbers", () => {
    expect(isPhoneNumberJP("03-1234-5678")).toBe(true)
    expect(isPhoneNumberJP("06-1234-5678")).toBe(true)
    expect(isPhoneNumberJP("090-1234-5678")).toBe(true)
    expect(isPhoneNumberJP("0312345678")).toBe(true)
    expect(isPhoneNumberJP("01-2-3456")).toBe(true)
  })

  it("returns false for invalid Japanese phone-like numbers", () => {
    expect(isPhoneNumberJP("1234")).toBe(false)
    expect(isPhoneNumberJP("abc-defg-hijk")).toBe(false)
    expect(isPhoneNumberJP("０３-１２３４-５６７８")).toBe(false)
  })
})

describe("isStrictPhoneNumberJP", () => {
  it.each([
    "070-1234-5678", "08012345678", "090-1234-5678",
    "050-1234-5678", "05012345678",
    "0120-123-456", "0120123456", "0800-123-4567", "08001234567",
  ])("accepts %s", (value) => {
    expect(isStrictPhoneNumberJP(value)).toBe(true)
  })

  it.each([
    "", "090-12345678", "0901234-5678", "090-1234-567", "090-1234-56789",
    "050-123-45678", "0120-12-3456", "0120-123456", "0800-1234-567",
    "01-2-3456", "03-1234-5678", "０９０-１２３４-５６７８", "090-1234-5678\n",
  ])("rejects %j", (value) => {
    expect(isStrictPhoneNumberJP(value)).toBe(false)
  })

  it("accepts only the selected kinds", () => {
    const kinds = ["landline", "mobile"] as const
    expect(isStrictPhoneNumberJP("03-1234-5678", { kinds })).toBe(true)
    expect(isStrictPhoneNumberJP("090-1234-5678", { kinds })).toBe(true)
    expect(isStrictPhoneNumberJP("050-1234-5678", { kinds })).toBe(false)
    expect(isStrictPhoneNumberJP("0120-123-456", { kinds })).toBe(false)
    expect(isStrictPhoneNumberJP("05012345678", { kinds: ["ip"] })).toBe(true)
    expect(isStrictPhoneNumberJP("08001234567", { kinds: ["tollFree"] })).toBe(true)
    expect(isStrictPhoneNumberJP("09012345678", { kinds: ["landline"] })).toBe(false)
    expect(isStrictPhoneNumberJP("09012345678", { kinds: [] })).toBe(false)
  })

  it("retains the default kinds for empty options", () => {
    expect(isStrictPhoneNumberJP("09012345678", {})).toBe(true)
    expect(isStrictPhoneNumberJP("05012345678", {})).toBe(true)
    expect(isStrictPhoneNumberJP("0120123456", {})).toBe(true)
    expect(isStrictPhoneNumberJP("0312345678", {})).toBe(false)
    expect(isStrictPhoneNumberJP("06012345678")).toBe(false)
  })

  it.each([
    ["03-1234-5678", true, false, true],
    ["0312345678", true, false, true],
    ["090-1234-5678", true, false, true],
    ["+81312345678", false, true, true],
    ["+81-3-1234-5678", false, true, true],
    ["+81-11-234-5678", false, true, true],
    ["+81-4998-2-1234", false, true, true],
    ["+819012345678", false, true, true],
    ["+81-90-1234-5678", false, true, true],
  ])("applies the selected format to %s", (value, domestic, international, either) => {
    const kinds = ["landline", "mobile"] as const
    expect(isStrictPhoneNumberJP(value, { kinds, format: "domestic" })).toBe(domestic)
    expect(isStrictPhoneNumberJP(value, { kinds, format: "international" })).toBe(international)
    expect(isStrictPhoneNumberJP(value, { kinds, format: "either" })).toBe(either)
  })

  it.each([
    "+81-03-1234-5678", "+8109012345678", "+813-1234-5678", "+81-9012345678",
    "+81-90-12345678", "+81 (3) 1234-5678", "＋８１３１２３４５６７８",
    "+82-3-1234-5678", "0081312345678", "+81-31-234-5678", "+81-3-1234-567",
    "+81-90-1234-56789", "+81-3-1234-5678\n",
  ])("rejects out-of-format input %j", (value) => {
    expect(isStrictPhoneNumberJP(value, { kinds: ["landline", "mobile"], format: "either" })).toBe(false)
  })

  it("applies the selected kinds to +81 inputs", () => {
    const format = "international"
    expect(isStrictPhoneNumberJP("+819012345678", { format })).toBe(true)
    expect(isStrictPhoneNumberJP("+81312345678", { format })).toBe(false)
    expect(isStrictPhoneNumberJP("+81312345678", { kinds: ["landline"], format })).toBe(true)
    expect(isStrictPhoneNumberJP("+819012345678", { kinds: ["landline"], format })).toBe(false)
    expect(isStrictPhoneNumberJP("+819012345678", { kinds: [], format })).toBe(false)
    expect(isStrictPhoneNumberJP("+819012345678")).toBe(false)
  })

  it("accepts IP and toll-free numbers only in domestic notation", () => {
    const kinds = ["ip", "tollFree"] as const
    expect(isStrictPhoneNumberJP("050-1234-5678", { kinds, format: "either" })).toBe(true)
    expect(isStrictPhoneNumberJP("0120-123-456", { kinds, format: "either" })).toBe(true)
    expect(isStrictPhoneNumberJP("0800-123-4567", { kinds, format: "international" })).toBe(false)
    expect(isStrictPhoneNumberJP("+81-50-1234-5678", { kinds, format: "either" })).toBe(false)
    expect(isStrictPhoneNumberJP("+81120123456", { kinds, format: "either" })).toBe(false)
    expect(isStrictPhoneNumberJP("+818001234567", { kinds, format: "either" })).toBe(false)
  })
})

describe("validateStrictPhoneNumberJP", () => {
  const contact = { kinds: ["landline", "mobile"], format: "domestic" } as const

  it.each([
    ["03-1234-5678", contact, "landline", "domestic"],
    ["09012345678", contact, "mobile", "domestic"],
    ["050-1234-5678", {}, "ip", "domestic"],
    ["0800-123-4567", {}, "tollFree", "domestic"],
    ["08001234567", {}, "tollFree", "domestic"],
    ["08001234567", { kinds: ["tollFree", "mobile"] }, "tollFree", "domestic"],
    ["08001234567", { kinds: ["mobile"] }, "mobile", "domestic"],
    ["+81-3-1234-5678", { kinds: ["landline"], format: "either" }, "landline", "international"],
    ["+819012345678", { format: "international" }, "mobile", "international"],
  ] as const)("reports the kind and notation of %s", (value, options, kind, format) => {
    const result = validateStrictPhoneNumberJP(value, options)
    expect(result).toEqual({ ok: true, kind, format })
    expect(isStrictPhoneNumberJP(value, options)).toBe(result.ok)
  })

  it.each([
    ["", { kinds: [], format: "international" }, "empty"],
    ["　 ", contact, "invalid_format"],
    ["+81-03-1234-5678", contact, "invalid_format"],
    ["+81-50-1234-5678", { kinds: ["ip"], format: "either" }, "invalid_format"],
    ["03-12345678", contact, "invalid_format"],
    ["0101234567", contact, "invalid_format"],
    ["050-1234-5678", contact, "kind_not_allowed"],
    ["03-1234-5678", {}, "kind_not_allowed"],
    ["+81-90-1234-5678", { kinds: ["landline"], format: "domestic" }, "kind_not_allowed"],
    ["09012345678", { kinds: [], format: "either" }, "kind_not_allowed"],
    ["+81-3-1234-5678", contact, "format_not_allowed"],
    ["050-1234-5678", { kinds: ["ip"], format: "international" }, "format_not_allowed"],
  ] as const)("reports why %j was rejected", (value, options, reason) => {
    const result = validateStrictPhoneNumberJP(value, options)
    expect(result).toEqual({ ok: false, reason })
    expect(isStrictPhoneNumberJP(value, options)).toBe(result.ok)
  })
})

describe("isLandlinePhoneJP", () => {
  it.each([
    "03-1234-5678", "011-234-5678", "0467-23-4567", "04998-2-1234",
    "04-2920-1234", "042-311-1234",
  ])("accepts %s with or without both hyphens", (value) => {
    expect(isLandlinePhoneJP(value)).toBe(true)
    expect(isLandlinePhoneJP(value.replace(/-/g, ""))).toBe(true)
  })

  it.each([
    "", "031-234-5678", "042-920-1234", "04-2311-1234",
    "03-12345678", "031234-5678", "03-1234-567", "03-1234-56789",
    "0101234567", "0990-12-3456", "0120-123-456", "050-1234-5678", "090-1234-5678",
    "+81-3-1234-5678", "０３-１２３４-５６７８", "03-1234-5678\n",
  ])("rejects %j", (value) => {
    expect(isLandlinePhoneJP(value)).toBe(false)
  })
})

describe("isKatakana", () => {
  it("returns true for full-width katakana text", () => {
    expect(isKatakana("タナカ")).toBe(true)
    expect(isKatakana("タナカ タロウ")).toBe(true)
    expect(isKatakana("タナカ　タロウ")).toBe(true)
    expect(isKatakana("タナカ・タロウ")).toBe(true)
    expect(isKatakana(" \t\n　")).toBe(true)
  })

  it("returns false for non-katakana text", () => {
    expect(isKatakana("たなか")).toBe(false)
    expect(isKatakana("田中")).toBe(false)
    expect(isKatakana("ﾀﾅｶ")).toBe(false)
    expect(isKatakana("")).toBe(false)
  })
})

describe("isFurigana", () => {
  it.each(["タナカ", "タナカ タロウ", "タナカ　タロウ", "ジョー・ヤマダ"])(
    "accepts %s", (value) => {
      expect(isFurigana(value)).toBe(true)
    },
  )

  it.each(["", " 　", "ー・", "タナカ\tタロウ", "タナカ\n", "たなか", "ﾀﾅｶ"])(
    "rejects %j", (value) => {
      expect(isFurigana(value)).toBe(false)
    },
  )
})

describe("validateFurigana", () => {
  it.each(["タナカ タロウ", "　ジョー・ヤマダ ", "ァヶ", "ガ"])("accepts %s", (value) => {
    const result = validateFurigana(value)
    expect(result).toEqual({ ok: true })
    expect(isFurigana(value)).toBe(result.ok)
  })

  it.each([
    ["", "empty"],
    [" ", "missing_katakana"],
    ["　", "missing_katakana"],
    ["ー", "missing_katakana"],
    ["・", "missing_katakana"],
    ["　・ー ", "missing_katakana"],
    ["たなか", "invalid_character"],
    ["ﾀﾅｶ", "invalid_character"],
    ["カ\u3099", "invalid_character"],
    ["ヷ", "invalid_character"],
    ["タナカ\tタロウ", "invalid_character"],
    ["タナカ\n", "invalid_character"],
    ["・\t", "invalid_character"],
  ] as const)("reports why %j was rejected", (value, reason) => {
    const result = validateFurigana(value)
    expect(result).toEqual({ ok: false, reason })
    expect(isFurigana(value)).toBe(result.ok)
  })
})

describe("isZenkaku", () => {
  it("returns true when ASCII half-width characters are not included", () => {
    expect(isZenkaku("山田太郎")).toBe(true)
    expect(isZenkaku("ヤマダタロウ")).toBe(true)
    expect(isZenkaku("こんにちは")).toBe(true)
    expect(isZenkaku("ﾀﾅｶ")).toBe(true)
    expect(isZenkaku("　")).toBe(true)
    expect(isZenkaku("🙂")).toBe(true)
  })

  it("returns false when ASCII half-width characters are included", () => {
    expect(isZenkaku("山田Taro")).toBe(false)
    expect(isZenkaku("山田 太郎")).toBe(false)
    expect(isZenkaku("")).toBe(false)
  })
})

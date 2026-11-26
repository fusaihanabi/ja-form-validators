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
  validateZenkaku,
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

describe("postal code validation details", () => {
  const options = { includeDetails: true } as const

  it.each([
    ["150🙂0001", 3, "🙂"],
    ["15--0🙂A", 5, "🙂"],
    ["150−0001", 3, "−"],
    ["150-0001\n", 8, "\n"],
  ] as const)("identifies the first invalid character in %j", (value, index, character) => {
    expect(validatePostalCodeJP(value, options)).toEqual({
      ok: false, reason: "invalid_character", index, character,
    })
    expect(value.slice(index, index + character.length)).toBe(character)
  })

  it.each([
    ["150-001", 6],
    ["15-001", 5],
    ["1500-0001", 8],
    ["--", 0],
  ] as const)("counts the digits in %j before checking separators", (value, digitCount) => {
    expect(validatePostalCodeJP(value, options)).toEqual({
      ok: false, reason: "invalid_length", digitCount,
    })
  })

  it.each([
    ["150--0001", 4],
    ["150-00-01", 6],
    ["15--00001", 2],
    ["-150-0001", 0],
    ["1500001-", 7],
  ] as const)("identifies the first misplaced or extra hyphen in %j", (value, index) => {
    expect(validatePostalCodeJP(value, options)).toEqual({
      ok: false, reason: "invalid_separator", index, character: "-",
    })
  })

  it("keeps the result shape for success, empty input, and disabled details", () => {
    expect(validatePostalCodeJP("150-0001", options)).toEqual({ ok: true })
    expect(validatePostalCodeJP("", options)).toEqual({ ok: false, reason: "empty" })
    expect(validatePostalCodeJP("150--0001", { includeDetails: false })).toEqual({
      ok: false, reason: "invalid_separator",
    })
    expect(isPostalCodeJP("150--0001")).toBe(false)
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
    expect(isStrictPhoneNumberJP("06002345678")).toBe(false)
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
    ["08001234567", { kinds: ["mobile"], kindMatching: "compatible" }, "mobile", "domestic"],
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

describe("phone number kind matching", () => {
  const mobileOnly = { kinds: ["mobile"], format: "either" } as const
  const bothKinds = { kinds: ["mobile", "tollFree"], format: "either" } as const

  it.each([
    ["08001234567", bothKinds, "tollFree", "domestic"],
    ["08001234567", { kinds: ["tollFree", "mobile"] }, "tollFree", "domestic"],
    ["0800-123-4567", { kinds: ["tollFree"] }, "tollFree", "domestic"],
    ["080-1234-5678", mobileOnly, "mobile", "domestic"],
    ["+81-80-1234-5678", mobileOnly, "mobile", "international"],
    ["+818012345678", mobileOnly, "mobile", "international"],
    ["+81-3-1234-5678", { kinds: ["landline"], format: "either" }, "landline", "international"],
    ["050-1234-5678", { kinds: ["ip"] }, "ip", "domestic"],
  ] as const)("classifies %s with default and explicit specific matching", (value, options, kind, format) => {
    const settings = { ...options, kindMatching: "specific" } as const
    const expected = { ok: true, kind, format }
    expect(validateStrictPhoneNumberJP(value, options)).toEqual(expected)
    expect(validateStrictPhoneNumberJP(value, settings)).toEqual(expected)
    expect(isStrictPhoneNumberJP(value, options)).toBe(true)
    expect(isStrictPhoneNumberJP(value, settings)).toBe(true)
  })

  it.each([
    ["", mobileOnly, "empty"],
    ["08001234567", mobileOnly, "kind_not_allowed"],
    ["0800-123-4567", mobileOnly, "kind_not_allowed"],
    ["080-0123-4567", bothKinds, "invalid_format"],
    ["080-0123-4567", mobileOnly, "invalid_format"],
    ["0800123-4567", bothKinds, "invalid_format"],
    ["+818001234567", bothKinds, "invalid_format"],
    ["+81-80-0123-4567", bothKinds, "invalid_format"],
    ["+81-800-123-4567", bothKinds, "invalid_format"],
    ["+815012345678", { kinds: ["ip"], format: "either" }, "invalid_format"],
    ["08001234567", { kinds: ["mobile"], format: "international" }, "kind_not_allowed"],
    ["08001234567", { kinds: ["tollFree"], format: "international" }, "format_not_allowed"],
  ] as const)("reports why %j was rejected with default and explicit specific matching", (value, options, reason) => {
    const settings = { ...options, kindMatching: "specific" } as const
    const expected = { ok: false, reason }
    expect(validateStrictPhoneNumberJP(value, options)).toEqual(expected)
    expect(validateStrictPhoneNumberJP(value, settings)).toEqual(expected)
    expect(isStrictPhoneNumberJP(value, options)).toBe(false)
    expect(isStrictPhoneNumberJP(value, settings)).toBe(false)
  })

  it.each(["08001234567", "080-0123-4567", "+818001234567", "+81-80-0123-4567"])(
    "retains the previous mobile match for %s with compatible matching",
    (value) => {
      const settings = { ...mobileOnly, kindMatching: "compatible" } as const
      const format = value.startsWith("+") ? "international" : "domestic"
      expect(validateStrictPhoneNumberJP(value, settings)).toEqual({ ok: true, kind: "mobile", format })
      expect(isStrictPhoneNumberJP(value, settings)).toBe(true)
    },
  )
})

describe("060 mobile numbers", () => {
  const mobile = { kinds: ["mobile"], format: "either" } as const

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])("accepts 060-%i as a mobile prefix", (digit) => {
    const domestic = "060-" + digit + "234-5678"
    const international = "+81-60-" + digit + "234-5678"
    expect(isMobilePhoneJP(domestic)).toBe(true)
    expect(isMobilePhoneJP(domestic.replace(/-/g, ""))).toBe(true)
    for (const kindMatching of ["specific", "compatible"] as const) {
      const options = { ...mobile, kindMatching }
      expect(validateStrictPhoneNumberJP(domestic, options)).toEqual({ ok: true, kind: "mobile", format: "domestic" })
      expect(validateStrictPhoneNumberJP(international, options)).toEqual({ ok: true, kind: "mobile", format: "international" })
      expect(isStrictPhoneNumberJP(domestic.replace(/-/g, ""), options)).toBe(true)
      expect(isStrictPhoneNumberJP(international.replace(/-/g, ""), options)).toBe(true)
    }
  })

  it.each([
    "060-0234-5678", "06002345678", "+81-60-0234-5678", "+816002345678",
    "060-123-5678", "060-1234-56789", "+81-060-1234-5678", "０６０-１２３４-５６７８",
  ])("rejects %j", (value) => {
    expect(isMobilePhoneJP(value)).toBe(false)
    expect(validateStrictPhoneNumberJP(value, mobile)).toEqual({ ok: false, reason: "invalid_format" })
    expect(isStrictPhoneNumberJP(value, { ...mobile, kindMatching: "compatible" })).toBe(false)
  })

  it("keeps the different separator and format policies", () => {
    expect(isMobilePhoneJP("060-12345678")).toBe(true)
    expect(isMobilePhoneJP("0601234-5678")).toBe(true)
    expect(isMobilePhoneJP("+81-60-1234-5678")).toBe(false)
    expect(validateStrictPhoneNumberJP("060-12345678", mobile)).toEqual({ ok: false, reason: "invalid_format" })
    expect(validateStrictPhoneNumberJP("0601234-5678", mobile)).toEqual({ ok: false, reason: "invalid_format" })
    expect(validateStrictPhoneNumberJP("+816012345678")).toEqual({ ok: false, reason: "format_not_allowed" })
    expect(validateStrictPhoneNumberJP("06012345678", { kinds: ["landline"] })).toEqual({
      ok: false, reason: "kind_not_allowed",
    })
  })

  it("keeps 06 landlines and 0800 toll-free numbers distinct", () => {
    expect(isMobilePhoneJP("06-1234-5678")).toBe(false)
    expect(validateStrictPhoneNumberJP("06-1234-5678", { kinds: ["landline", "mobile"] })).toEqual({
      ok: true, kind: "landline", format: "domestic",
    })
    expect(validateStrictPhoneNumberJP("08001234567")).toEqual({
      ok: true, kind: "tollFree", format: "domestic",
    })
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

describe("Furigana NFC normalization", () => {
  const options = { normalization: "NFC" } as const

  it.each(["カ\u3099", "ハ\u309A", "カ\u3099・ハ\u309A"])(
    "accepts %j only when NFC composes the combining marks",
    (value) => {
      const invalid = { ok: false, reason: "invalid_character" }
      expect(validateFurigana(value)).toEqual(invalid)
      expect(validateFurigana(value, { normalization: "none" })).toEqual(invalid)
      expect(validateFurigana(value, options)).toEqual({ ok: true })
      expect(isFurigana(value)).toBe(false)
      expect(isFurigana(value, options)).toBe(true)
    },
  )

  it.each(["ガ", "パ", "　タナカ・タロウ "])("accepts %j in both modes", (value) => {
    expect(validateFurigana(value)).toEqual({ ok: true })
    expect(validateFurigana(value, options)).toEqual({ ok: true })
    expect(isFurigana(value, options)).toBe(true)
  })

  it.each([
    ["", "empty"],
    ["　・ー", "missing_katakana"],
    ["ｶﾞ", "invalid_character"],
    ["ワ\u3099", "invalid_character"],
    ["ヷ", "invalid_character"],
    ["か\u3099", "invalid_character"],
    ["カ\u3099\t", "invalid_character"],
    ["　\u3099", "invalid_character"],
  ] as const)("keeps the validation rules for %j after NFC", (value, reason) => {
    expect(validateFurigana(value, options)).toEqual({ ok: false, reason })
    expect(isFurigana(value, options)).toBe(false)
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

describe("validateZenkaku", () => {
  const options = { rejectHalfwidthKana: true }

  it.each(["山田太郎", "　", "🙂", "･", "\uFFA0", "\u001F", "\u007F"])(
    "accepts %j with either setting",
    (value) => {
      expect(validateZenkaku(value)).toEqual({ ok: true })
      expect(validateZenkaku(value, options)).toEqual({ ok: true })
      expect(isZenkaku(value)).toBe(true)
      expect(isZenkaku(value, options)).toBe(true)
    },
  )

  it.each(["ﾀﾅｶ", "ｶﾞ", "ｰ", "山田ﾀﾛｳ", "\uFF66", "\uFF9E", "\uFF9F"])(
    "rejects %j only when halfwidth kana is disallowed",
    (value) => {
      expect(validateZenkaku(value)).toEqual({ ok: true })
      expect(validateZenkaku(value, { rejectHalfwidthKana: false })).toEqual({ ok: true })
      expect(validateZenkaku(value, options)).toEqual({ ok: false, reason: "halfwidth_kana" })
      expect(isZenkaku(value)).toBe(true)
      expect(isZenkaku(value, options)).toBe(false)
    },
  )

  it.each([
    ["", "empty"],
    [" ", "printable_ascii"],
    ["~", "printable_ascii"],
    ["山田Taro", "printable_ascii"],
    ["山田Taroﾀﾅｶ", "printable_ascii"],
  ] as const)("reports the first applicable reason for %j", (value, reason) => {
    const expected = { ok: false, reason }
    expect(validateZenkaku(value)).toEqual(expected)
    expect(validateZenkaku(value, options)).toEqual(expected)
    expect(isZenkaku(value, options)).toBe(false)
  })
})

describe("Zenkaku control character rejection", () => {
  const options = { rejectControlCharacters: true } as const

  it.each([
    "\u0000", "\u001F", "\u007F", "\u0080", "\u009F",
    "山田\t太郎", "山田\n太郎", "山田\r太郎",
  ])("rejects %j only when control characters are disallowed", (value) => {
    expect(validateZenkaku(value)).toEqual({ ok: true })
    expect(validateZenkaku(value, { rejectControlCharacters: false })).toEqual({ ok: true })
    expect(validateZenkaku(value, options)).toEqual({ ok: false, reason: "control_character" })
    expect(isZenkaku(value)).toBe(true)
    expect(isZenkaku(value, options)).toBe(false)
  })

  it.each(["山田　太郎", "\u00A0", "\u2028", "🙂"])(
    "allows %j outside the control character ranges",
    (value) => {
      expect(validateZenkaku(value, options)).toEqual({ ok: true })
      expect(isZenkaku(value, options)).toBe(true)
    },
  )

  it.each([
    ["", "empty"],
    [" \n", "printable_ascii"],
    ["~\u007F", "printable_ascii"],
    ["山田Taroﾀﾅｶ\n", "printable_ascii"],
    ["ﾀﾅｶ\n", "halfwidth_kana"],
    ["山田太郎\n", "control_character"],
  ] as const)("reports the first applicable reason for %j", (value, reason) => {
    const allOptions = { ...options, rejectHalfwidthKana: true }
    expect(validateZenkaku(value, allOptions)).toEqual({ ok: false, reason })
    expect(isZenkaku(value, allOptions)).toBe(false)
  })

  it("checks control characters even when halfwidth kana are allowed", () => {
    expect(validateZenkaku("ﾀﾅｶ\n", options)).toEqual({ ok: false, reason: "control_character" })
  })
})

describe("Zenkaku invalid character details", () => {
  const options = {
    includeInvalidCharacter: true,
    rejectHalfwidthKana: true,
    rejectControlCharacters: true,
  } as const

  it.each([
    ["🙂山田Taro", "printable_ascii", 4, "T"],
    ["\t山田Taro", "printable_ascii", 3, "T"],
    ["ｶA", "printable_ascii", 1, "A"],
    ["山田 太郎", "printable_ascii", 2, " "],
    ["\n山田ﾀﾅｶ", "halfwidth_kana", 3, "ﾀ"],
    ["🙂ガﾞ", "halfwidth_kana", 3, "ﾞ"],
    ["🙂\t山田\n", "control_character", 2, "\t"],
    ["山田\u009F", "control_character", 2, "\u009F"],
  ] as const)("reports the first character for the selected reason in %j", (value, reason, index, character) => {
    const result = validateZenkaku(value, options)
    expect(result).toEqual({ ok: false, reason, index, character })
    expect(value.slice(index, index + character.length)).toBe(character)
  })

  it("keeps the existing shape for success and empty input", () => {
    expect(validateZenkaku("山田　太郎", options)).toEqual({ ok: true })
    expect(validateZenkaku("", options)).toEqual({ ok: false, reason: "empty" })
  })

  it("keeps the existing shape with details omitted or disabled", () => {
    const expected = { ok: false, reason: "printable_ascii" }
    expect(validateZenkaku("山田Taro")).toEqual(expected)
    expect(validateZenkaku("山田Taro", { includeInvalidCharacter: false })).toEqual(expected)
    expect(isZenkaku("山田Taro")).toBe(false)
  })

  it("reports only characters disallowed by the selected options", () => {
    expect(validateZenkaku("ﾀ\t", { includeInvalidCharacter: true })).toEqual({ ok: true })
    expect(validateZenkaku("ﾀ\t", { includeInvalidCharacter: true, rejectControlCharacters: true })).toEqual({
      ok: false, reason: "control_character", index: 1, character: "\t",
    })
  })
})

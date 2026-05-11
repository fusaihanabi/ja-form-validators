import { describe, expect, it } from "vitest"
import {
  isKatakana,
  isMobilePhoneJP,
  isPhoneNumberJP,
  isPostalCodeJP,
  isZenkaku,
} from "../src"

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

describe("isMobilePhoneJP", () => {
  it("returns true for valid Japanese mobile phone numbers", () => {
    expect(isMobilePhoneJP("090-1234-5678")).toBe(true)
    expect(isMobilePhoneJP("08012345678")).toBe(true)
    expect(isMobilePhoneJP("070-1234-5678")).toBe(true)
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
  })

  it("returns false for invalid Japanese phone-like numbers", () => {
    expect(isPhoneNumberJP("1234")).toBe(false)
    expect(isPhoneNumberJP("abc-defg-hijk")).toBe(false)
    expect(isPhoneNumberJP("０３-１２３４-５６７８")).toBe(false)
  })
})

describe("isKatakana", () => {
  it("returns true for full-width katakana text", () => {
    expect(isKatakana("タナカ")).toBe(true)
    expect(isKatakana("タナカ タロウ")).toBe(true)
    expect(isKatakana("タナカ　タロウ")).toBe(true)
    expect(isKatakana("タナカ・タロウ")).toBe(true)
  })

  it("returns false for non-katakana text", () => {
    expect(isKatakana("たなか")).toBe(false)
    expect(isKatakana("田中")).toBe(false)
    expect(isKatakana("ﾀﾅｶ")).toBe(false)
    expect(isKatakana("")).toBe(false)
  })
})

describe("isZenkaku", () => {
  it("returns true when ASCII half-width characters are not included", () => {
    expect(isZenkaku("山田太郎")).toBe(true)
    expect(isZenkaku("ヤマダタロウ")).toBe(true)
    expect(isZenkaku("こんにちは")).toBe(true)
  })

  it("returns false when ASCII half-width characters are included", () => {
    expect(isZenkaku("山田Taro")).toBe(false)
    expect(isZenkaku("山田 太郎")).toBe(false)
    expect(isZenkaku("")).toBe(false)
  })
})

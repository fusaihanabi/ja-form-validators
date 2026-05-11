# ja-form-validators

Tiny TypeScript validators for Japanese form inputs.

- 郵便番号
- 携帯電話番号
- 日本の電話番号っぽい形式
- 全角カタカナ
- 全角文字

## Install

```bash
npm install ja-form-validators
```

## Usage

```ts
import {
  isPostalCodeJP,
  isMobilePhoneJP,
  isPhoneNumberJP,
  isKatakana,
  isZenkaku,
} from "ja-form-validators"

isPostalCodeJP("150-0001")
// true

isMobilePhoneJP("090-1234-5678")
// true

isKatakana("タナカ タロウ")
// true
```

## API

### `isPostalCodeJP(value: string): boolean`

Checks whether the value is a Japanese postal code.

```ts
isPostalCodeJP("150-0001") // true
isPostalCodeJP("1500001")  // true
isPostalCodeJP("１５０-０００１") // false
```

### `isMobilePhoneJP(value: string): boolean`

Checks whether the value is a Japanese mobile phone number starting with `070`, `080`, or `090`.

```ts
isMobilePhoneJP("090-1234-5678") // true
isMobilePhoneJP("08012345678")   // true
isMobilePhoneJP("03-1234-5678")  // false
```

### `isPhoneNumberJP(value: string): boolean`

Checks whether the value looks like a Japanese phone number.

This is intentionally lightweight and not a complete phone-number parser.

```ts
isPhoneNumberJP("03-1234-5678")  // true
isPhoneNumberJP("090-1234-5678") // true
```

### `isKatakana(value: string): boolean`

Checks whether the value contains only full-width katakana, spaces, long vowel marks, and middle dots.

```ts
isKatakana("タナカ") // true
isKatakana("タナカ タロウ") // true
isKatakana("たなか") // false
```

### `isZenkaku(value: string): boolean`

Checks whether the value does not include ASCII half-width characters.

```ts
isZenkaku("山田太郎") // true
isZenkaku("山田Taro") // false
```

## Works great with normalize-ja-input

This library does not normalize input.

If you want to normalize full-width digits, spaces, or hyphen-like characters before validation, use it with `normalize-ja-input`.

```ts
import { normalizeJaInput } from "normalize-ja-input"
import { isMobilePhoneJP } from "ja-form-validators"

const value = normalizeJaInput("０９０ー１２３４ー５６７８")

isMobilePhoneJP(value)
// true
```

## Design policy

`ja-form-validators` only validates strings.

---

## Live Demo

- Demo → `https://fusaihanabi.github.io/ja-form-validators/`
- npm → `https://www.npmjs.com/package/ja-form-validators`
- GitHub → `https://github.com/fusaihanabi/ja-form-validators`
- Official → `https://dl.fusai-hanabi.com`

---

It does not:

- normalize input
- format values
- parse addresses
- validate emails or URLs

## License

MIT

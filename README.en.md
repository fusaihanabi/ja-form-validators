# ja-form-validators

[日本語](README.md) · [Live demo](https://fusaihanabi.github.io/ja-form-validators/) · [API](#api) · [Related libraries](#related-libraries) · [Changelog](CHANGELOG.md)

Small, dependency-free TypeScript validators for Japanese form inputs. Check the format of postal codes, phone numbers, furigana, and fields that require fullwidth text. Use the `is…` functions for boolean checks and the `validate…` functions to show field-specific feedback.

## Install

```sh
npm install ja-form-validators
```

The package provides ESM and TypeScript declarations. Browsers can import the ESM entry from [unpkg](https://unpkg.com/ja-form-validators/dist/index.js) or [jsDelivr](https://cdn.jsdelivr.net/npm/ja-form-validators/dist/index.js). [Browser import examples](https://fusaihanabi.github.io/ja-form-validators/#cdn)

```ts
import { isFurigana, isPostalCodeJP, isStrictPhoneNumberJP } from "ja-form-validators"

isPostalCodeJP("150-0001") // true
isFurigana("タナカ タロウ") // true

isStrictPhoneNumberJP("+81-3-1234-5678", {
  kinds: ["landline", "mobile"],
  format: "either",
}) // true
```

## API

### Postal codes

`isPostalCodeJP(value)` checks for seven ASCII digits with an optional ASCII hyphen after the third digit. Both `150-0001` and `1500001` pass. `validatePostalCodeJP(value, options?)` uses the same rules and returns `PostalCodeResult`.

| Reason | Condition | With `includeDetails: true` |
| --- | --- | --- |
| `empty` | Empty string | — |
| `invalid_character` | A character other than an ASCII digit or hyphen | `index` and `character` of the first disallowed character |
| `invalid_length` | A digit count other than seven | `digitCount`, excluding hyphens |
| `invalid_separator` | Seven digits with a misplaced or extra hyphen | `index` and `character` of the first offending hyphen |

The first matching reason in the table is returned. A successful check returns `{ ok: true }`. Pass `{ includeDetails: true }` as `PostalCodeValidationOptions` to get `PostalCodeResult<true>`.

```ts
import { validatePostalCodeJP } from "ja-form-validators"

validatePostalCodeJP("150-001", { includeDetails: true })
// { ok: false, reason: "invalid_length", digitCount: 6 }

validatePostalCodeJP("150--0001", { includeDetails: true })
// { ok: false, reason: "invalid_separator", index: 4, character: "-" }
```

`index` is a zero-based UTF-16 offset. Use `input.setSelectionRange(index, index + character.length)` to highlight the offending character in a text field.

### Phone numbers

| Function | Use |
| --- | --- |
| `isPhoneNumberJP(value)` | A lightweight check for a string that looks like a Japanese phone number. |
| `isMobilePhoneJP(value)` | A simple check for domestic mobile numbers starting with `060`, `070`, `080`, or `090`. The digit after `060` must be `1`–`9`. |
| `isLandlinePhoneJP(value)` | Checks a domestic landline against bundled number patterns and area-code grouping. Use both hyphens in the correct positions, or omit both. |
| `isStrictPhoneNumberJP(value, options?)` | Checks the number kind and validates the grouping and allowed notation. |
| `validateStrictPhoneNumberJP(value, options?)` | Uses the strict check and returns the recognized kind and notation or a failure reason. |

`StrictPhoneNumberOptions.kinds` specifies which kinds to accept. The default is `mobile`, `ip`, and `tollFree`. An empty array accepts zero kinds.

| Kind | Domestic examples |
| --- | --- |
| `landline` | `03-1234-5678`, `011-234-5678` |
| `mobile` | `060-1234-5678`, `070-1234-5678`, `080-1234-5678`, `090-1234-5678` |
| `ip` | `050-1234-5678` |
| `tollFree` | `0120-123-456`, `0800-123-4567` |

`format` defaults to `"domestic"`. Set `"international"` for `+81` notation or `"either"` to accept both notations where supported. Landlines and mobile numbers support `+81` with the domestic leading `0` omitted. For example, `03-1234-5678` becomes `+81-3-1234-5678` or `+81312345678`. Put hyphens at every expected separator position or omit all of them. IP and toll-free numbers use domestic notation.

`validateStrictPhoneNumberJP` returns `{ ok: true, kind, format }` for valid input. The returned `format` is `"domestic"` or `"international"`. For invalid input it returns `{ ok: false, reason }` with a `StrictPhoneNumberFailureReason`.

| Reason | Condition |
| --- | --- |
| `empty` | Empty string |
| `invalid_format` | The input matches none of the supported forms, including input made entirely of whitespace |
| `kind_not_allowed` | The number kind is outside the selected `kinds` |
| `format_not_allowed` | An allowed kind uses notation excluded by `format` |

#### Phone number correction details

Pass `includeDetails: true` in `StrictPhoneNumberValidationOptions` to get `StrictPhoneNumberResult<true>`. An `invalid_format` result can include one of these `StrictPhoneNumberFormatDetail` values if the suggested correction would pass the same `kinds`, `format`, and `kindMatching` settings.

| Detail | Correction |
| --- | --- |
| `domestic_trunk_prefix` | Remove the domestic leading `0` directly after `+81`. |
| `partial_separator` | Add the missing hyphens at the expected separator positions, or remove all hyphens. |

```ts
import { validateStrictPhoneNumberJP } from "ja-form-validators"

const options = { kinds: ["landline", "mobile"], format: "either", includeDetails: true } as const

validateStrictPhoneNumberJP("+81-03-1234-5678", options)
// { ok: false, reason: "invalid_format", detail: "domestic_trunk_prefix" }

validateStrictPhoneNumberJP("090-12345678", options)
// { ok: false, reason: "invalid_format", detail: "partial_separator" }
```

Misplaced separators such as `09012-345678` receive the general `invalid_format` result. `includeDetails` defaults to `false`.

#### Number kind matching and migration from 0.9.0

`kindMatching: "specific"` is the default since 1.0.0. It identifies the number kind from the digits, checks the notation for that kind, then applies `kinds` and `format`. For example, `08001234567` is classified as `tollFree`, so a mobile-only field returns `kind_not_allowed`.

Set `kindMatching: "compatible"` on either strict function to retain the 0.9.0 behavior. It chooses from the allowed kinds that match the input notation.

| Input | Allowed kinds and notation | `"specific"` | `"compatible"` |
| --- | --- | --- | --- |
| `08001234567` | Mobile, domestic | `kind_not_allowed` | Valid mobile |
| `080-0123-4567` | Mobile, domestic | `invalid_format` | Valid mobile |
| `+818001234567` | Mobile, `"either"` | `invalid_format` | Valid mobile |
| `080-1234-5678` | Mobile, domestic | Valid mobile | Valid mobile |
| `0800-123-4567` | Toll-free, domestic | Valid toll-free | Valid toll-free |

The `060` check follows the number ranges described in the changelog. [Number range change in 1.1.0](CHANGELOG.md#110)

### Katakana and furigana

`isKatakana(value)` checks a nonempty string for fullwidth katakana, prolonged sound marks, middle dots, and whitespace. For a name-reading field, use `isFurigana(value, options?)` or `validateFurigana(value, options?)`. A valid furigana value contains at least one katakana from `ァ` through `ヶ` and can include `ー`, `・`, and ASCII or ideographic spaces.

| `FuriganaFailureReason` | Condition |
| --- | --- |
| `empty` | Empty string |
| `invalid_character` | A character outside the allowed set |
| `missing_katakana` | Only allowed spaces and marks, with no katakana |

`FuriganaOptions.normalization` defaults to `"none"`. Set `"NFC"` to compose combining voiced and semi-voiced marks before checking the same character set. Halfwidth forms such as `ｶﾞ` still give `invalid_character`. A successful `FuriganaResult` is `{ ok: true }`.

```ts
import { validateFurigana } from "ja-form-validators"

validateFurigana("タナカ タロウ") // { ok: true }
validateFurigana("　・ー") // { ok: false, reason: "missing_katakana" }
validateFurigana("カ\u3099", { normalization: "NFC" }) // { ok: true }
```

### Fullwidth fields

`isZenkaku(value, options?)` checks for a nonempty string free of printable ASCII, including ASCII spaces. Enable `rejectHalfwidthKana` to also reject characters from `U+FF66` to `U+FF9F`. Enable `rejectControlCharacters` to reject C0 and C1 controls, including tabs and line breaks. Both options default to `false` in `ZenkakuOptions`.

`validateZenkaku` returns `{ ok: true }` or `{ ok: false, reason }`. Reasons are evaluated in this order.

| `ZenkakuFailureReason` | Condition |
| --- | --- |
| `empty` | Empty string |
| `printable_ascii` | A printable ASCII character from `U+0020` to `U+007E` |
| `halfwidth_kana` | A halfwidth kana or mark when `rejectHalfwidthKana` is enabled |
| `control_character` | A character from `U+0000` to `U+001F` or `U+007F` to `U+009F` when `rejectControlCharacters` is enabled |

Pass `includeInvalidCharacter: true` in `ZenkakuValidationOptions` to add the first matching `character` and its zero-based UTF-16 `index` for the selected reason. Empty-input failures retain the same shape. With a typed options variable, use `ZenkakuOptions<true>` to enable control checks or `ZenkakuOptions<boolean>` to toggle them at runtime. When `includeInvalidCharacter` can vary, check `"index" in result` before reading its position.

```ts
import { validateZenkaku } from "ja-form-validators"

validateZenkaku("🙂山田Taro", { includeInvalidCharacter: true })
// { ok: false, reason: "printable_ascii", index: 4, character: "T" }

validateZenkaku("山田\t太郎", { rejectControlCharacters: true })
// { ok: false, reason: "control_character" }
```

## Inquiry form example

Validate each field and use its failure reason to select the message shown next to it. This example accepts domestic and international notation for landlines and mobile numbers.

```ts
import { validateFurigana, validatePostalCodeJP, validateStrictPhoneNumberJP } from "ja-form-validators"

function validateInquiry(values: { postalCode: string; phone: string; furigana: string }) {
  return {
    postalCode: validatePostalCodeJP(values.postalCode, { includeDetails: true }),
    phone: validateStrictPhoneNumberJP(values.phone, {
      kinds: ["landline", "mobile"],
      format: "either",
      includeDetails: true,
    }),
    furigana: validateFurigana(values.furigana),
  }
}

validateInquiry({ postalCode: "150-001", phone: "+81-3-1234-5678", furigana: "ﾀﾅｶ" })
// postalCode: invalid_length with digitCount: 6
// phone: valid landline in international notation
// furigana: invalid_character
```

When a field allows variations in width, spacing, or hyphens, normalize its value before validating it. [Try the inquiry form](https://fusaihanabi.github.io/ja-form-validators/#form-demo) · [Try normalization before validation](https://fusaihanabi.github.io/ja-form-validators/#normalize)

```ts
import { normalizeJaInput } from "normalize-ja-input"
import { isStrictPhoneNumberJP } from "ja-form-validators"

isStrictPhoneNumberJP(normalizeJaInput("０９０ー１２３４ー５６７８")) // true
```

## Related libraries

| Library | Purpose | Demo |
| --- | --- | --- |
| [normalize-ja-input](https://github.com/fusaihanabi/normalize-ja-input) | Normalize variations in character width, spaces, and hyphens before validation. | [Live demo](https://fusaihanabi.github.io/normalize-ja-input/) |
| [ja-ime-utils](https://github.com/fusaihanabi/ja-ime-utils) | Track Japanese IME composition and distinguish confirmation from form submission. | [Live demo](https://fusaihanabi.github.io/ja-ime-utils/) |
| [ja-input-mask](https://github.com/fusaihanabi/ja-input-mask) | Format phone numbers and postal codes while the user types, with paste and caret support. | [Live demo](https://fusaihanabi.github.io/ja-input-mask/) |
| [ja-char-check](https://github.com/fusaihanabi/ja-char-check) | Check character sets, encoding compatibility, and byte counts before storage or data exchange. | [Live demo](https://fusaihanabi.github.io/ja-char-check/) |
| [tiny-ja-date](https://github.com/fusaihanabi/tiny-ja-date) | Format dates for Japanese interfaces and calculate calendar or business days. | [Live demo](https://fusaihanabi.github.io/tiny-ja-date/) |
| [tiny-ja-money](https://github.com/fusaihanabi/tiny-ja-money) | Parse and format whole yen amounts, calculate consumption tax, and allocate amounts. | [Live demo](https://fusaihanabi.github.io/tiny-ja-money/) |
| [ja-zengin-utils](https://github.com/fusaihanabi/ja-zengin-utils) | Process Zengin kana and 120-byte fixed-width bulk transfer files. | [Live demo](https://fusaihanabi.github.io/ja-zengin-utils/) |

[Fusai Hanabi OSS](https://dl.fusai-hanabi.com/)

## Development

```sh
npm ci
npm test
npm run check:package
npm publish --dry-run --offline
```

`npm run build` emits the JavaScript and TypeScript declarations and updates `docs/validators.js` and `docs/landline-metadata.js`. Serve `docs/` from a static HTTP server to try the demo locally. `npm run check:package` builds the library and verifies that a temporary consumer can type-check and run imports by package name.

Landline patterns and grouping rules come from the Japanese metadata in libphonenumber v9.0.43. To regenerate them, download the XML for the target tag and pass the local XML file and tag to the update script. Run the tests and build, then update the metadata, demo assets, and source version together. [Upstream metadata](https://github.com/google/libphonenumber/blob/v9.0.43/resources/PhoneNumberMetadata.xml)

```sh
node scripts/update-landline-metadata.mjs v9.0.43 ./PhoneNumberMetadata.xml
npm test
npm run build
```

## License

The library is [MIT](LICENSE). The bundled landline metadata is covered by the [Apache License 2.0](docs/LICENSE-libphonenumber.txt).

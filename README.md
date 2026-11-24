# ja-form-validators

Tiny TypeScript validators for Japanese form inputs.

- 郵便番号
- 携帯電話番号
- 日本の電話番号っぽい形式
- 携帯電話・IP電話・フリーダイヤルの厳密な形式
- 全角カタカナ
- 氏名欄向けのフリガナ
- 表示可能な半角 ASCII の有無

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
  isStrictPhoneNumberJP,
  isKatakana,
  isFurigana,
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

### `isStrictPhoneNumberJP(value: string): boolean`

国内向けの半角数字で、下表の番号形式を判定します。ハイフンは2か所とも入れるか、両方を省略できます。固定電話を含む入力には `isPhoneNumberJP` の簡易判定を使えます。

| 種類 | 対応する形式 |
| --- | --- |
| 携帯電話 | `070-1234-5678`、`080-1234-5678`、`090-1234-5678` |
| IP電話 | `050-1234-5678` |
| フリーダイヤル | `0120-123-456`、`0800-123-4567` |

```ts
isStrictPhoneNumberJP("090-1234-5678") // true
isStrictPhoneNumberJP("09012345678")   // true
isStrictPhoneNumberJP("090-12345678")  // false
isStrictPhoneNumberJP("03-1234-5678")  // false
```

### `isKatakana(value: string): boolean`

Checks whether the value contains only full-width katakana, spaces, long vowel marks, and middle dots.

```ts
isKatakana("タナカ") // true
isKatakana("タナカ タロウ") // true
isKatakana("たなか") // false
```

### `isFurigana(value: string): boolean`

氏名欄向けに、全角カタカナを1文字以上含むことを確認します。長音符、中黒、半角・全角スペースも使えます。

```ts
isFurigana("タナカ タロウ")   // true
isFurigana("ジョー・ヤマダ") // true
isFurigana("　")            // false
isFurigana("タナカ\tタロウ") // false
```

### `isZenkaku(value: string): boolean`

空文字、または表示可能な半角 ASCII（半角スペース、英数字、記号を含む）が入った文字列に `false` を返します。半角カタカナ、絵文字、全角スペースは通ります。

```ts
isZenkaku("山田太郎") // true
isZenkaku("山田Taro") // false
isZenkaku("ﾀﾅｶ")     // true
isZenkaku("🙂")       // true
isZenkaku("　")       // true
```

## Works great with normalize-ja-input

This library does not normalize input.

If you want to normalize full-width digits, spaces, or hyphen-like characters before validation, use it with `normalize-ja-input`.

```ts
import { normalizeJaInput } from "normalize-ja-input"
import { isStrictPhoneNumberJP } from "ja-form-validators"

const value = normalizeJaInput("０９０ー１２３４ー５６７８")

isStrictPhoneNumberJP(value)
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

`npm run build` は配布用の JavaScript と型定義を生成し、デモが読み込む `docs/validators.js` を更新します。
ローカルでデモを確認する場合は、`docs/` を静的ファイルサーバーで配信してください。

---

It does not:

- normalize input
- format values
- parse addresses
- validate emails or URLs

## License

MIT

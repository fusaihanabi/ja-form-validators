# ja-form-validators

Tiny TypeScript validators for Japanese form inputs.

- 郵便番号
- 携帯電話番号
- 日本の電話番号っぽい形式
- 固定電話・携帯電話・IP電話・フリーダイヤルの厳密な形式（固定電話と携帯電話は `+81` 表記にも対応）
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
  isLandlinePhoneJP,
  isStrictPhoneNumberJP,
  isKatakana,
  isFurigana,
  isZenkaku,
  validateFurigana,
  validatePostalCodeJP,
  validateStrictPhoneNumberJP,
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

### 理由付きの郵便番号判定 `validatePostalCodeJP`

`isPostalCodeJP` と同じ基準で、半角数字7桁の郵便番号を判定します。ハイフンを使う場合は3桁目の後に半角の `-` を1つ入れます。成功時は `{ ok: true }`、失敗時は `{ ok: false, reason }` を返します。戻り値の型は `PostalCodeResult`、理由コードの型は `PostalCodeFailureReason` です。

```ts
validatePostalCodeJP("150-0001")  // { ok: true }
validatePostalCodeJP("1500001")   // { ok: true }
validatePostalCodeJP("150-001")   // { ok: false, reason: "invalid_length" }
validatePostalCodeJP("15--00001") // { ok: false, reason: "invalid_separator" }
```

上から順に判定し、最初に該当した理由を返します。

| 理由コード | 条件 | 表示メッセージの例 |
| --- | --- | --- |
| `empty` | 空文字 | 郵便番号を入力してください。 |
| `invalid_character` | 半角数字と半角ハイフン以外の文字を含む | 半角数字と半角ハイフンを使ってください。 |
| `invalid_length` | ハイフンを除くと半角数字が7桁以外 | 数字を7桁入力してください。 |
| `invalid_separator` | 半角数字は7桁だが、ハイフンの位置または個数が不正 | ハイフンを入れる場合は、3桁目の後に1つ入れてください。 |

`isPostalCodeJP` は同じ判定結果の `ok` を返します。判定の対象は入力形式です。

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

### `isLandlinePhoneJP(value: string): boolean`

国内固定電話の半角数字10桁を対象に、同梱データに基づいて番号の先頭部分と区切りを判定します。ハイフンは市外局番に合った位置に2か所とも入れるか、両方を省略できます。判定対象は番号の形式です。

```ts
isLandlinePhoneJP("03-1234-5678") // true
isLandlinePhoneJP("0312345678")   // true
isLandlinePhoneJP("031-234-5678") // false
```

### 厳密な電話番号判定 `isStrictPhoneNumberJP`

第2引数の `kinds` で、下表から受け付ける種類を指定できます。配列が空なら `false` です。種類を省略した場合は、携帯電話・IP電話・フリーダイヤルを受け付けます。

| `PhoneNumberKind` | 対応する形式 |
| --- | --- |
| `landline`（固定電話） | `03-1234-5678`、`011-234-5678` など |
| `mobile`（携帯電話） | `070-1234-5678`、`080-1234-5678`、`090-1234-5678` |
| `ip`（IP電話） | `050-1234-5678` |
| `tollFree`（フリーダイヤル） | `0120-123-456`、`0800-123-4567` |

```ts
isStrictPhoneNumberJP("090-1234-5678") // true
isStrictPhoneNumberJP("09012345678")   // true
isStrictPhoneNumberJP("090-12345678")  // false
isStrictPhoneNumberJP("03-1234-5678")  // false

const options = { kinds: ["landline", "mobile"] } as const
isStrictPhoneNumberJP("03-1234-5678", options)  // true
isStrictPhoneNumberJP("050-1234-5678", options) // false
```

`format` で、国内表記と `+81` 表記のどちらを受け付けるか指定できます。

| `PhoneNumberFormat` | 受け付ける表記 |
| --- | --- |
| `domestic`（既定値） | 国内表記。各番号の区切り位置にハイフンを両方入れるか、両方を省略できます。 |
| `international` | 固定電話・携帯電話の `+81` 表記。 |
| `either` | `kinds` で選んだ種類について、対応するどちらの表記も受け付けます。 |

`+81` 表記では国内用の先頭の `0` を外します。ハイフンは国番号の直後と番号の区切り位置の3か所すべてに入れるか、すべて省略できます。IP電話とフリーダイヤルは国内表記に対応しています。

```ts
const options = { kinds: ["landline", "mobile"], format: "either" } as const
isStrictPhoneNumberJP("03-1234-5678", options)     // true
isStrictPhoneNumberJP("+81-3-1234-5678", options)  // true
isStrictPhoneNumberJP("+819012345678", options)    // true
isStrictPhoneNumberJP("+81-03-1234-5678", options) // false
isStrictPhoneNumberJP("+813-1234-5678", options)   // false
```

### 理由付きの電話番号判定 `validateStrictPhoneNumberJP`

`isStrictPhoneNumberJP` と同じ `StrictPhoneNumberOptions` を使います。成功時は `ok: true`、番号の種類 `kind`、入力の表記 `format` が返ります。失敗時は `ok: false` と理由コード `reason` が返ります。TypeScript では `StrictPhoneNumberResult` の `ok` で結果を絞り込めます。

```ts
const options = { kinds: ["landline", "mobile"], format: "domestic" } as const

validateStrictPhoneNumberJP("03-1234-5678", options)
// { ok: true, kind: "landline", format: "domestic" }

validateStrictPhoneNumberJP("+81-3-1234-5678", options)
// { ok: false, reason: "format_not_allowed" }
```

上から順に判定し、最初に該当した理由を返します。下表は国内表記の固定電話と携帯電話を受け付けるフォームの例です。

| 理由コード | 条件 | 表示メッセージの例 |
| --- | --- | --- |
| `empty` | 空文字 | 電話番号を入力してください。 |
| `invalid_format` | 対応する電話番号形式に当てはまらない入力。空白だけの入力も含みます。 | 03-1234-5678 のように入力してください。 |
| `kind_not_allowed` | 有効な形式だが、指定した `kinds` の対象外 | 固定電話または携帯電話の番号を入力してください。 |
| `format_not_allowed` | 許可された番号の種類だが、指定した `format` の対象外 | 国内表記（03-1234-5678 など）で入力してください。 |

成功結果の `format` は `"domestic"` または `"international"` です。`isStrictPhoneNumberJP` は同じ判定結果の `ok` を返します。

ハイフンなしの `0800` で始まる入力は、形式上、携帯電話とフリーダイヤルの両方に当てはまる場合があります。両方を許可した場合は `tollFree` が返ります。

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

### 理由付きのフリガナ判定 `validateFurigana`

`isFurigana` と同じ基準で氏名欄のフリガナを判定します。成功時は `{ ok: true }`、失敗時は `{ ok: false, reason }` を返します。TypeScript では `FuriganaResult` の `ok` で結果を絞り込めます。理由コードの型は `FuriganaFailureReason` です。

```ts
validateFurigana("タナカ タロウ") // { ok: true }
validateFurigana("")              // { ok: false, reason: "empty" }
validateFurigana("　・ー")        // { ok: false, reason: "missing_katakana" }
validateFurigana("ﾀﾅｶ")          // { ok: false, reason: "invalid_character" }
```

上から順に判定し、最初に該当した理由を返します。

| 理由コード | 条件 | 表示メッセージの例 |
| --- | --- | --- |
| `empty` | 空文字 | フリガナを入力してください。 |
| `invalid_character` | 許可されていない文字を含む | タナカ タロウ のように、全角カタカナで入力してください。 |
| `missing_katakana` | 許可された記号と空白だけで構成されている | 全角カタカナを1文字以上入力してください。 |

許可する文字は `ァ`〜`ヶ`、長音符 `ー`、中黒 `・`、半角・全角スペースです。合成済みの `ガ` は通り、`カ\u3099`（`カ` と結合濁点）は `invalid_character` になります。表記ゆれを受け付ける場合は判定前に正規化してください。`isFurigana` は同じ判定結果の `ok` を返します。

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

`npm run build` は配布用の JavaScript と型定義を生成し、デモが読み込む `docs/validators.js` と `docs/landline-metadata.js` を更新します。
ローカルでデモを確認する場合は、`docs/` を静的ファイルサーバーで配信してください。

## 固定電話データの更新

固定電話の判定データは、[libphonenumber v9.0.43 の日本向けメタデータ](https://github.com/google/libphonenumber/blob/v9.0.43/resources/PhoneNumberMetadata.xml)（2026年11月4日版）から、固定電話の番号パターンと国内の区切り規則を抽出したものです。判定は同梱データだけで動作します。

更新する場合は、上流の対象タグから `PhoneNumberMetadata.xml` を取得し、タグ名とローカルの XML ファイルを指定して再生成します。その後、テストとビルドを実行し、生成データ、デモ用ファイル、この節の出典と版を更新します。

```sh
node scripts/update-landline-metadata.mjs v9.0.43 ./PhoneNumberMetadata.xml
npm test
npm run build
```

---

It does not:

- normalize input
- format values
- parse addresses
- validate emails or URLs

## License

ライブラリ本体は [MIT](LICENSE) です。同梱する固定電話データには [Apache License 2.0](docs/LICENSE-libphonenumber.txt) が適用されます。

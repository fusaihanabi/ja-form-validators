# ja-form-validators

Tiny TypeScript validators for Japanese form inputs.

- 郵便番号
- 携帯電話番号
- 日本の電話番号っぽい形式
- 固定電話・携帯電話・IP電話・フリーダイヤルの厳密な形式（固定電話と携帯電話は `+81` 表記にも対応）
- 全角カタカナ
- 氏名欄向けのフリガナ
- 表示可能な半角 ASCII と、設定に応じた半角カタカナの有無

## Install

```bash
npm install ja-form-validators
```

`0.9.0` から更新する場合は、電話番号判定の既定値変更を確認してください。 [変更履歴](CHANGELOG.md)

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
  validateZenkaku,
} from "ja-form-validators"

isPostalCodeJP("150-0001")
// true

isMobilePhoneJP("090-1234-5678")
// true

isKatakana("タナカ タロウ")
// true
```

## 問い合わせフォームでの使用例

郵便番号、電話番号、フリガナをそれぞれ判定し、欄ごとの案内文を返します。電話番号は固定電話と携帯電話を対象にし、国内表記と `+81` 表記を受け付けます。

```ts
import {
  validateFurigana,
  validatePostalCodeJP,
  validateStrictPhoneNumberJP,
  type FuriganaFailureReason,
  type PostalCodeFailureReason,
  type StrictPhoneNumberFailureReason,
  type StrictPhoneNumberOptions,
} from "ja-form-validators"

const postalCodeMessages: Record<PostalCodeFailureReason, string> = {
  empty: "郵便番号を入力してください。",
  invalid_character: "半角数字と半角ハイフンを使ってください。",
  invalid_length: "数字を7桁入力してください。",
  invalid_separator: "ハイフンを入れる場合は、3桁目の後に1つ入れてください。",
}

const phoneOptions: StrictPhoneNumberOptions = {
  kinds: ["landline", "mobile"],
  format: "either",
}
const phoneMessages: Record<StrictPhoneNumberFailureReason, string> = {
  empty: "電話番号を入力してください。",
  invalid_format: "03-1234-5678 や +81-3-1234-5678 のように入力してください。",
  kind_not_allowed: "固定電話または携帯電話の番号を入力してください。",
  format_not_allowed: "国内表記または +81 表記で入力してください。",
}

const furiganaMessages: Record<FuriganaFailureReason, string> = {
  empty: "フリガナを入力してください。",
  invalid_character: "タナカ タロウ のように、全角カタカナで入力してください。",
  missing_katakana: "全角カタカナを1文字以上入力してください。",
}

function validateInquiry(values: { postalCode: string; phone: string; furigana: string }) {
  const postalCode = validatePostalCodeJP(values.postalCode)
  const phone = validateStrictPhoneNumberJP(values.phone, phoneOptions)
  const furigana = validateFurigana(values.furigana)

  return {
    postalCode: postalCode.ok ? "" : postalCodeMessages[postalCode.reason],
    phone: phone.ok ? "" : phoneMessages[phone.reason],
    furigana: furigana.ok ? "" : furiganaMessages[furigana.reason],
  }
}

const errors = validateInquiry({
  postalCode: "150-001",
  phone: "+81-3-1234-5678",
  furigana: "ﾀﾅｶ",
})
// errors.postalCode は「数字を7桁入力してください。」
// errors.phone は空文字、errors.furigana は全角カタカナの案内
```

空文字が返った欄はそのまま進めます。送信時は空文字以外の案内をすべて表示し、最初に修正が必要な欄にフォーカスを移します。表記ゆれを許容する欄は、`validateInquiry` に値を渡す前に正規化してください。

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

`060`・`070`・`080`・`090` で始まる携帯電話番号の国内表記を判定します。`060` は直後に `1`〜`9` が続く11桁が対象です。

```ts
isMobilePhoneJP("090-1234-5678") // true
isMobilePhoneJP("08012345678")   // true
isMobilePhoneJP("060-1234-5678") // true
isMobilePhoneJP("060-0234-5678") // false
isMobilePhoneJP("03-1234-5678")  // false
```

`060` の番号構成は、2024年12月20日付の電気通信番号計画の変更で施行されました。この API は番号形式を判定します。利用者への提供開始時期は事業者の案内を参照してください。 [総務省告示第441号](https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000284288) · [携帯事業者5社の提供開始延期の発表](https://www.docomo.ne.jp/info/news_release/2026/07/08_00.html)

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
| `mobile`（携帯電話） | `060-1234-5678`、`070-1234-5678`、`080-1234-5678`、`090-1234-5678` |
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
isStrictPhoneNumberJP("+81-60-1234-5678", options) // true
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

### 番号の種類を先に確定する `kindMatching`

`validateStrictPhoneNumberJP` と `isStrictPhoneNumberJP` の両方で、`StrictPhoneNumberOptions.kindMatching` に次の値を指定できます。

| `PhoneNumberKindMatching` | 判定方法 |
| --- | --- |
| `specific`（`1.0.0` 以降の既定値） | ハイフンを除いた番号から種類を決め、その種類で使える区切りと表記を検査してから、`kinds` と `format` を適用します。 |
| `compatible` | 入力された表記に合う種類のうち、`kinds` で許可したものを選びます。`0.9.0` までの既定の方式です。 |

`1.1.0` で追加した `060` の番号帯は、どちらの方式でも携帯電話として判定します。

`08001234567` は、ハイフンを除いた状態で携帯電話とフリーダイヤルの両方に当てはまります。`specific` では、`kinds` の指定順にかかわらず、先に `tollFree` に分類します。

```ts
validateStrictPhoneNumberJP("08001234567", { kinds: ["mobile"] })
// { ok: false, reason: "kind_not_allowed" }
```

#### `0.9.0` から `1.0.0` への移行

`0.9.0` の既定の挙動を使う場合は、既存の設定に `kindMatching: "compatible"` を追加します。どちらの関数でも指定できます。

```ts
isStrictPhoneNumberJP("08001234567", { kinds: ["mobile"], kindMatching: "compatible" })
// true
```

| 入力 | 許可する種類と表記 | `1.0.0` の既定値 | `compatible` を指定 |
| --- | --- | --- | --- |
| `08001234567` | 携帯、国内表記 | `kind_not_allowed` | `mobile` として成功 |
| `080-0123-4567` | 携帯、国内表記 | `invalid_format` | `mobile` として成功 |
| `+818001234567` | 携帯、`format: "either"` | `invalid_format` | `mobile` として成功 |
| `080-1234-5678` | 携帯、国内表記 | `mobile` として成功 | `mobile` として成功 |
| `0800-123-4567` | フリーダイヤル、国内表記 | `tollFree` として成功 | `tollFree` として成功 |

`0800` で始まるフリーダイヤルにハイフンを入れる場合は `0800-123-4567` の形です。フリーダイヤルは国内表記に対応しています。

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

### `isZenkaku(value: string, options?: ZenkakuOptions): boolean`

空文字、または表示可能な半角 ASCII（半角スペース、英数字、記号を含む）が入った文字列に `false` を返します。`rejectHalfwidthKana: true` を指定すると、半角カタカナも弾きます。既定値の `false` では半角カタカナが通ります。

```ts
isZenkaku("山田太郎") // true
isZenkaku("山田Taro") // false
isZenkaku("ﾀﾅｶ") // true
isZenkaku("ﾀﾅｶ", { rejectHalfwidthKana: true }) // false
```

### 理由付きの判定 `validateZenkaku`

`isZenkaku` と同じ `ZenkakuOptions` を使います。成功時は `{ ok: true }`、失敗時は `{ ok: false, reason }` を返します。戻り値の型は `ZenkakuResult`、理由コードの型は `ZenkakuFailureReason` です。`isZenkaku` はこの判定結果の `ok` を返します。

理由は上から順に判定します。

| 理由コード | 条件 | 表示メッセージの例 |
| --- | --- | --- |
| `empty` | 空文字 | 文字を入力してください。 |
| `printable_ascii` | 半角スペースを含む表示可能な ASCII（`U+0020`〜`U+007E`）がある | 半角英数字・記号・スペースを全角にしてください。 |
| `halfwidth_kana` | `rejectHalfwidthKana: true` で、半角カタカナ・長音符・濁点・半濁点（`U+FF66`〜`U+FF9F`）がある | カタカナを全角にしてください。 |

| 入力 | 既定の判定 | `rejectHalfwidthKana: true` |
| --- | --- | --- |
| `山田Taroﾀﾅｶ` | `printable_ascii` | `printable_ascii` |
| `ﾀﾅｶ`、`ｶﾞ`、`ｰ` | 成功 | `halfwidth_kana` |
| 全角スペース、`🙂`、半角中黒の `･` | 成功 | 成功 |

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

## 配布用ファイルの検証

`npm run check:package` を実行すると、ビルド後に `package.json` の `files` に指定されたものを一時的な利用側プロジェクトへ配置します。パッケージ名で判定 API を読み込み、TypeScript の型チェックと JavaScript の実行を確認します。npm 公開前の処理でもこの検証を実行します。

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

# 変更履歴

## 1.6.0

- `validatePostalCodeJP` に `includeDetails` を追加しました。有効にすると、桁数のエラーでは `digitCount` を、文字やハイフンのエラーでは `index` と `character` を返します。省略時は従来の結果形式です。
- デモで、数字を何桁追加・削除するかを案内し、該当する文字やハイフンを選択できるようにしました。

## 1.5.0

- `validateZenkaku` に `includeInvalidCharacter` を追加しました。有効にすると、最初に該当した理由の対象文字と UTF-16 インデックスを返します。成功時、空文字、設定を省略した場合は従来の結果形式です。
- デモで問題のある文字のコードポイントを確認し、入力欄でその文字を選択できます。

## 1.4.0

- `validateFurigana` と `isFurigana` に `FuriganaOptions.normalization` を追加しました。`"NFC"` を指定すると判定時に濁点・半濁点を合成し、`カ\u3099` や `ハ\u309A` を受け付けます。
- 既定値は `"none"` です。判定できる文字範囲と理由コードは `1.3.0` と共通です。

## 1.3.0

- `isZenkaku` と `validateZenkaku` に `rejectControlCharacters` を追加しました。`true` を指定すると、タブや改行を含む `U+0000`〜`U+001F` と `U+007F`〜`U+009F` を弾きます。`validateZenkaku` は既存の理由に該当しない場合に `control_character` を返します。
- オプション省略時は `1.2.0` と同じ結果を返します。TypeScript では、制御文字の拒否を有効にできる設定で `control_character` が戻り値の型に含まれます。

## 1.2.0

- `isZenkaku` に `rejectHalfwidthKana` を追加しました。`true` を指定すると `U+FF66`〜`U+FF9F` の半角カタカナ・長音符・濁点・半濁点を弾きます。省略時の判定は `1.1.0` と同じです。
- `validateZenkaku` を追加しました。`empty`、`printable_ascii`、`halfwidth_kana` の優先順で理由を返します。

## 1.1.0

`isMobilePhoneJP`、`isStrictPhoneNumberJP`、`validateStrictPhoneNumberJP` で、`060` の直後に `1`〜`9` が続く国内11桁を携帯電話として判定できるようにしました。厳密な判定では国内表記の `060-1234-5678` と、許可された場合の `+81-60-1234-5678` を受け付けます。`060-0234-5678` は携帯電話の対象範囲外です。

番号構成の変更は2024年12月20日に施行されました。利用者への提供開始時期は事業者ごとの案内に従います。 [総務省告示第441号](https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000284288) · [携帯事業者5社の提供開始延期の発表](https://www.docomo.ne.jp/info/news_release/2026/07/08_00.html)

## 1.0.0

`validateStrictPhoneNumberJP` と `isStrictPhoneNumberJP` の `kindMatching` の既定値を `"specific"` に変更しました。番号の種類を先に確定し、その種類の入力形式と `kinds`・`format` の設定を確認します。

- 携帯専用欄の `08001234567` はフリーダイヤルに分類され、`kind_not_allowed` を返します。
- 携帯番号の区切りで書いた `080-0123-4567` と、`+81` 表記の `+818001234567` は `invalid_format` を返します。
- 電話番号デモでは「種類を先に確定」が初期選択です。問い合わせフォームはライブラリの既定値を使います。

`0.9.0` の既定の判定を使う場合は、既存のオプションに `kindMatching: "compatible"` を追加してください。

```ts
isStrictPhoneNumberJP(value, { kinds: ["mobile"], kindMatching: "compatible" })
```

[移行時の入力例と結果](README.md#090-から-100-への移行)

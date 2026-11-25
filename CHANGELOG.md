# 変更履歴

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

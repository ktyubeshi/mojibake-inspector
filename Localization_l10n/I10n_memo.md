-----
最終更新: 2024-12-14
-----

公式ドキュメント
https://github.com/microsoft/vscode-l10n

# VS Code拡張機能のローカライズ実装ガイド

## 1. 必要な依存関係

`package.json`の例:
```json
{
  "engines": {
    "vscode": "^1.73.0"  // VS Code 1.73以降が必要
  },
  "devDependencies": {
    "@types/vscode": "^1.73.0",   // VS Code型定義
    "@vscode/l10n-dev": "^0.0.18", // 開発用ツール（XLIFF変換など）
    "typescript": "^5.7.2",
    "eslint": "^9.13.0"
  },
  "dependencies": {
    "@vscode/l10n": "^0.0.10" // サブプロセス用翻訳ライブラリ
  }
}
```

> `@vscode/l10n-dev` のバージョンは公式サンプルで `0.0.18` が使用されています。必要に応じて最新情報を確認してください。

## 2. ファイル構造

```text
your-extension/
  ├── l10n/
  │   ├── bundle.l10n.json         // 自動生成される翻訳元ファイル（英語）
  │   ├── bundle.l10n.ja.json      // 翻訳後ファイル（日本語など）
  ├── package.nls.json
  ├── package.nls.ja.json
  ├── package.json
  └── src/...
```

`package.json` 内で以下を設定することで、`l10n`フォルダを参照します:
```json
{
  "l10n": "./l10n",
  "contributes": {
    "commands": [
      {
        "command": "my-extension.command",
        "title": "%my-extension.command.title%"
      }
    ]
  }
}
```

### 2.1 静的な翻訳（package.nls.json）
```json
{
  "my-extension.command.title": "コマンド名（英語）",
  "my-extension.message": "メッセージ（英語）"
}
```

### 2.2 日本語翻訳（package.nls.ja.json）
```json
{
  "my-extension.command.title": "コマンド名（日本語）",
  "my-extension.message": "メッセージ（日本語）"
}
```

`%my-extension.command.title%` などのキーは、VS Codeがユーザーのロケールに応じて適切な`package.nls.{locale}.json`を参照します。

## 3. コードでの実装例（メインプロセス）

```typescript
import * as vscode from 'vscode';

// 単純なメッセージの翻訳
vscode.window.showInformationMessage(vscode.l10n.t('メッセージ'));

// パラメータ付きメッセージ
vscode.window.showInformationMessage(vscode.l10n.t('{0}を含むメッセージ', paramValue));
```

## 4. サブプロセスでの翻訳

メインプロセス（`extension.ts`）では `vscode.l10n.t` を使用しますが、サブプロセス（nodeのサブスクリプト、CLIツールなど）では `@vscode/l10n` を使用します。

```typescript
import * as l10n from '@vscode/l10n';

if (process.env['EXTENSION_BUNDLE_PATH']) {
  l10n.config({ fsPath: process.env['EXTENSION_BUNDLE_PATH'] });
}

const message = l10n.t('メッセージ');
console.log(message);
```

> **注意**: メイン拡張機能コード内では`@vscode/l10n`を使わず、`vscode.l10n.t`を使用してください。

## 5. XLIFFサポート（ローカライズ用ツール）

`@vscode/l10n-dev`ツールでコード内の翻訳文字列を抽出してXLIFF形式に出力したり、XLIFFからJSONに戻すことが可能です。

```bash
# XLIFFファイルの生成（英語の原文抽出）
npx @vscode/l10n-dev export -o ./translations/messages.xlf

# XLIFFからJSONへのインポート（翻訳反映）
npx @vscode/l10n-dev import -i ./translations/messages.ja.xlf -o ./l10n/bundle.l10n.ja.json
```

これにより、`bundle.l10n.json`や`bundle.l10n.ja.json`が更新され、VS Code拡張で翻訳が使用可能になります。

## 6. 動作確認手順

1. VS Codeの表示言語を日本語（`ja`）に設定
   - コマンドパレット（`Ctrl+Shift+P`）で `Configure Display Language` 実行
   - `ja`を選択しVS Code再起動
2. 拡張機能を再読み込み
   - コマンドパレットで `Developer: Reload Window` を実行

## 7. トラブルシューティング

### 7.1 翻訳が反映されない場合
- VS Codeの言語設定が`ja`など、適切な言語になっているか確認
- `package.nls.ja.json`のキーと`package.json`で参照しているキーが一致しているか確認
- VS Codeを再起動

### 7.2 ビルドエラーの場合
- VS Codeバージョンが1.73.0以上か確認
- `@types/vscode`が対応バージョンか確認
- `%key%`形式などが正しいか確認

## 8. ベストプラクティス

1. キー命名規則：`my-extension.***`のようにプレフィックスをつける
2. プレースホルダー使用時は順序と意味が分かりやすいメッセージを
3. 翻訳ファイルはバージョン管理する
4. 全文字列が翻訳されているか、適切なコンテキストであるかを確認

-----
内容未検証
-----
# VS Code拡張機能のローカライズ実装ガイド

## 1. 必要な依存関係

### package.jsonへの追加
```
{
  "devDependencies": {
    "@vscode/l10n-dev": "^0.0.35"  // ローカライズ開発ツール
  }
}
```

## 2. ファイル構造

```
your-extension/
  ├── l10n/
  │   ├── bundle.l10n.json    // ビルド設定
  │   └── ja/
  │       └── strings.json    // 日本語翻訳ファイル
  ├── package.json
  └── webpack.config.js
```

### 2.1 翻訳ファイル (l10n/ja/strings.json)
```
{
  "コマンド名や表示名": "日本語訳",
  "メッセージ": "日本語訳",
  "{0}を含むメッセージ": "{0}を含む日本語訳"
}
```

### 2.2 ビルド設定 (l10n/bundle.l10n.json)
```
{
  "languages": ["ja"],
  "outDir": "."
}
```

### 2.3 package.jsonのl10n設定
```
{
  "l10n": {
    "path": "./l10n",
    "languages": ["ja"]
  }
}
```

## 3. webpackの設定

### webpack.config.jsの設定
```
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  // ... 他の設定 ...
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'l10n',
          to: 'l10n',
          noErrorOnMissing: true
        }
      ]
    })
  ]
};
```

## 4. コードでの実装

### 4.1 基本的な使用方法
```
import * as vscode from 'vscode';

// 単純なメッセージの翻訳
vscode.window.showInformationMessage(vscode.l10n.t('メッセージ'));

// パラメータを含むメッセージの翻訳
vscode.window.showInformationMessage(vscode.l10n.t('{0}を含むメッセージ', paramValue));
```

### 4.2 package.jsonのコマンド定義
```
{
  "contributes": {
    "commands": [
      {
        "command": "extension.commandId",
        "title": "Command Name"  // この文字列が翻訳対象
      }
    ]
  }
}
```

## 5. ビルドプロセス

### 5.1 ビルドスクリプトの追加（package.json）
```
{
  "scripts": {
    "l10n-build": "@vscode/l10n-dev build",
    "vscode:prepublish": "npm run l10n-build && npm run package"
  }
}
```

### 5.2 ビルド手順
1. `npm run l10n-build` - ローカライズファイルのビルド
2. `npm run package` - 拡張機能のパッケージング

## 6. 動作確認

1. VS Codeの表示言語を日本語に設定
   - コマンドパレット（`Ctrl+Shift+P`）で`Configure Display Language`を実行
   - `ja`を選択してVS Codeを再起動

2. 拡張機能の再読み込み
   - コマンドパレット（`Ctrl+Shift+P`）で`Developer: Reload Window`を実行

## 7. トラブルシューティング

### 7.1 翻訳が反映されない場合
- VS Codeの言語設定が`ja`になっているか確認
- `l10n/ja/strings.json`の文字列がソースコードの文字列と完全に一致しているか確認
- ビルド後に`dist/l10n/ja/strings.json`が存在するか確認
- 拡張機能を完全に再読み込み（VS Codeの再起動）

### 7.2 ビルドエラーが発生する場合
- `@vscode/l10n-dev`が正しくインストールされているか確認
- `package.json`の`l10n`設定が正しいか確認
- `webpack.config.js`の`CopyPlugin`設定が正しいか確認

## 8. ベストプラクティス

1. 翻訳キーの命名規則
   - 英語の原文をそのままキーとして使用
   - 同じメッセージは同じキーを使用

2. メッセージの作成
   - プレースホルダー（`{0}`、`{1}`など）は順番を維持
   - 改行は`\n`で表現

3. ファイル管理
   - 翻訳ファイルは定期的にバックアップ
   - 変更履歴を管理

4. 品質管理
   - すべての文字列が翻訳されているか定期的に確認
   - 文脈に応じた適切な翻訳になっているか確認

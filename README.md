# Mojibake Inspector

Mojibake Inspectorは、テキストファイル内の文字化け（U+FFFD REPLACEMENT CHARACTER）を検出し、警告を表示するVSCode拡張機能です。

## 機能

- テキストファイル内の文字化け文字（U+FFFD）を自動検出
- 検出された文字化け箇所をエディタ内で視覚的に強調表示
- 文字化けの詳細情報（位置、文字コード）を表示
- Problems パネルでの文字化け一覧表示

## 使用方法

1. コマンドパレットを開く（`Ctrl+Shift+P` または `Cmd+Shift+P`）
2. 「文字化けを検出」コマンドを実行
3. アクティブなエディタ内の文字化けが検出され、以下の方法で表示されます：
   - エディタ内での警告表示（黄色の波線）
   - Problems パネルでの一覧表示
   - 検出箇所へのホバー時の詳細情報表示

## 要件

- Visual Studio Code バージョン 1.96.0 以上

## インストール

1. VSCodeの拡張機能マーケットプレースから「Mojibake Inspector」を検索
2. 「インストール」をクリック
3. VSCodeを再起動（必要な場合）

## 既知の問題

- 現在のバージョンでは、U+FFFD（REPLACEMENT CHARACTER）のみを検出します
- 大きなファイルでの検出に時間がかかる場合があります

## リリースノート

### 0.0.1

- 初期リリース
- 基本的な文字化け検出機能の実装
- 日本語対応UIの実装

## フィードバック

バグ報告や機能リクエストは[GitHub Issues](https://github.com/yourusername/mojibake-inspector/issues)にお願いします。

## ライセンス

MIT

---

**Enjoy!**

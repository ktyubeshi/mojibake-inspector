# Mojibake Inspector ビルド手順

このドキュメントでは、Mojibake Inspector VSCode拡張機能のビルド方法について説明します。

## 前提条件

- Node.js (v18以上推奨)
- npm (Node.jsに付属)
- Visual Studio Code

## 開発環境のセットアップ

1. リポジトリのクローン:
   ```bash
   git clone https://github.com/yourusername/mojibake-inspector.git
   cd mojibake-inspector
   ```

2. 依存パッケージのインストール:
   ```bash
   npm install
   ```

## ビルド手順

### 開発用ビルド

1. 開発モードでコンパイル（ウォッチモード）:
   ```bash
   npm run watch
   ```
   このコマンドを実行すると、ファイルの変更を監視し、自動的に再コンパイルが行われます。

2. Visual Studio Codeでデバッグ実行:
   - F5キーを押すか、デバッグビューから「Run Extension」を選択
   - 新しいVSCodeウィンドウが開き、拡張機能がデバッグモードで実行されます

### プロダクションビルド

1. プロダクション用にビルド:
   ```bash
   npm run package
   ```
   このコマンドにより、最適化された製品版のビルドが生成されます。

### テストの実行

1. リンターとテストの実行:
   ```bash
   npm run lint    # ESLintによるコード品質チェック
   npm run test    # テストの実行
   ```

## VSCode拡張機能のパッケージング

1. VSCEのインストール（初回のみ）:
   ```bash
   npm install -g @vscode/vsce
   ```

2. 拡張機能のパッケージング:
   ```bash
   vsce package
   ```
   このコマンドにより、配布可能な.vsixファイルが生成されます。

## 開発中のインストール

VSCodeの場合
```bash
code --install-extension mojibake-inspector-0.0.14.vsix
```

# Cursorの場合は、GUIからインストールすることを推奨します：
1. Cursorを開く
2. 拡張機能のビュー（Ctrl+Shift+X）を開く
3. タイトルバーの「...」（その他のアクション）をクリック
4. 「VSIXからのインストール...」を選択
5. 作成したVSIXファイルを選択

## トラブルシューティング

- ビルドエラーが発生した場合は、以下を試してください：
  1. `node_modules`フォルダを削除
  2. `npm install`を再実行
  3. `npm run compile`でビルドを再試行

- TypeScriptの型エラーが発生した場合は、`tsconfig.json`の設定を確認してください。

- 拡張機能のキャッシュをクリアする

  開発中に問題が発生した場合、以下の手順でキャッシュをクリアできます：

  #### Windows:
  ```bash
  # VSCode
  Remove-Item -Path "$env:USERPROFILE\.vscode\extensions\mojibake-inspector-*" -Recurse -Force

  # Cursor
  Remove-Item -Path "$env:USERPROFILE\.cursor\extensions\mojibake-inspector-*" -Recurse -Force
  ```

  #### macOS/Linux:
  ```bash
  # VSCode
  rm -rf ~/.vscode/extensions/mojibake-inspector-*

  # Cursor
  rm -rf ~/.cursor/extensions/mojibake-inspector-*
  ```

  キャッシュクリア後：
  1. VSCodeを再起動
  2. 拡張機能を再インストール

## 注意事項

- コミット前に必ずリンターとテストを実行してください
- 新機能の追加時は、対応するテストも追加してください 

# インストール方法

## 開発用インストール
1. プロジェクトをクローン
2. `npm install`を実行
3. VSCodeでプロジェクトを開く
4. F5キーを押してデバッグ実行

## 配布用VSIXの作成とインストール
1. `npm run package`を実行してvsixファイルを作成
2. 以下のいずれかの方法でインストール：

### 方法1: VSCodeのGUIを使用
1. VSCodeを開く
2. 拡張機能のビュー（Ctrl+Shift+X）を開く
3. タイトルバーの「...」（その他のアクション）をクリック
4. 「VSIXからのインストール...」を選択
5. 作成したVSIXファイルを選択

### 方法2: コマンドラインを使用
```bash
code --install-extension mojibake-inspector-0.0.14.vsix
```
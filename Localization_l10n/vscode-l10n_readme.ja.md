オリジナル
https://github.com/microsoft/vscode-l10n/blob/main/README.md

----

# Visual Studio Code 向けのローカライズツール

このリポジトリは、Visual Studio Code 拡張機能をローカライズするためのツール群を含んでいます。  
VS Code 拡張機能のソースコードをローカライズするには、以下の4つの重要な要素があります。

* [`vscode.l10n.t`](#vscodel10nt) - 拡張機能コード内で文字列を翻訳するためのAPI
* [`@vscode/l10n-dev`](#vscodel10n-dev) - VSCode拡張機能から l10n 文字列を抽出し、XLFファイルを扱うためのツール
* [`@vscode/l10n`](#vscodel10n) - 拡張機能のサブプロセス内で翻訳を読み込むためのライブラリ
* [`package.nls.json`](#packagenlsjson) - 拡張機能の`package.json`内の静的なコントリビューションを翻訳するためのファイル

これらのツールの使用例については、vscode-extension-samples リポジトリ内の [l10n-sample](https://github.com/microsoft/vscode-extension-samples/tree/main/l10n-sample) を参照してください。

## `vscode.l10n.t`

このAPIは、VS Code 1.73で導入され、拡張機能コード内の文字列を翻訳するために使用します。これはVS Code拡張機能APIの一部であり、詳細は[こちら](https://code.visualstudio.com/api/references/vscode-api#l10n)で確認できます。

> **注**
> 
> あなたの拡張機能マニフェスト中のVS Codeエンジンと`@types/vscode`のバージョンは、少なくとも `^1.73.0` 以上にしてください。

## `@vscode/l10n-dev`

VSCode拡張機能から `l10n` 文字列を抽出し、XLFファイルを扱うためのツールです。使用方法については、専用の[README](./l10n-dev)を参照してください。

## `@vscode/l10n`

拡張機能のサブプロセス内で翻訳を読み込むためのライブラリです。使用方法については、専用の[README](./l10n)を参照してください。

> **注**
>
> このライブラリは、拡張機能のメインプロセスでは **使用しないでください**。メインプロセスへの翻訳の読み込みはVS Code自身が行います。

## `package.nls.json`

このファイルと `package.nls.{locale}.json` ファイルは、拡張機能の `package.json` 内に記述された静的なコントリビューションを翻訳するために使用します。例を示します。

`./package.json`:

```jsonc
{
  "name": "my-extension",
  "version": "0.0.1",
  "main": "./out/extension.js",
  "l10n": "./l10n",
  //...
  "contributes": {
    "commands": [
      {
        "command": "my-extension.helloWorld",
        // キーは % で囲まれています
        "title": "%my-extension.helloWorld.title%"
      }
    ]
  }
}
```

`./package.nls.json`:

```jsonc
{
  // package.jsonと同じキー
  "my-extension.helloWorld.title": "Hello World"
}
```

`./package.nls.de.json`:

```jsonc
{
  // package.jsonと同じキー
  "my-extension.helloWorld.title": "Hallo Welt"
}
```

VS Code は、ユーザーのロケールに応じて適切な `package.nls.{locale}.json` (または英語用の `package.nls.json`) ファイルを自動的に読み込みます。特定のキーに対応する翻訳が存在しない場合、VS Code は英語の翻訳にフォールバックします。

> **注**
>
> [@vscode/l10n-dev](#vscodel10n-dev) には、これらのファイルを XLIFF ファイルに変換したり、疑似翻訳ファイルを生成したりするためのツールも用意されています。

## コントリビュートについて

このプロジェクトは、コントリビューションや提案を歓迎します。ほとんどのコントリビューションには、
Contributor License Agreement (CLA) に同意する必要があります。これにより、あなたがコントリビューションを行う権利を有し、実際に行い、
私たちがそのコントリビューションを使用する権利を与えることを宣言します。詳細については、
https://cla.opensource.microsoft.com を参照してください。

プルリクエストを送信すると、CLA ボットが自動的に CLA が必要かどうかを判断し、PR にステータスチェックやコメントを付与します。
ボットの指示に従ってください。一度CLAを提出すれば、同じCLAを利用する他のリポジトリでも再提出は不要です。

このプロジェクトは [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/) を採用しています。
詳細は [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) を参照するか、
追加の質問やコメントは [opencode@microsoft.com](mailto:opencode@microsoft.com) までお問い合わせください。

### ビルド手順

まず、`npm install` を使用してすべての依存関係をインストールします。

`l10n-dev` を扱う場合には、追加のステップが1つあります。このパッケージは、2つの文法で使用する tree-sitter WASM ファイルをビルドする必要があります。  
以下のコマンドを実行します:

```
cd l10n-dev
npm run build-wasm
```

> **注**
>
> macOS または Windows では、WASMファイルをビルドするために Docker が起動している必要があります。このCLIはLinuxコンテナを使用してWASMファイルをビルドします。

正しく実行できれば、`l10n-dev`フォルダーに2つの `.wasm` ファイルが生成されているはずです。

ここまで済んだら、リポジトリ内でビルドタスクを実行し、バックグラウンドでビルドを行った上で `npm test` を実行してテストを行うことができます。

## 商標について

このプロジェクトには、プロジェクト、製品、またはサービスに関する商標またはロゴが含まれている場合があります。Microsoft の商標またはロゴの正規の使用は、  
[Microsoft の商標およびブランドガイドライン](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general) に従う必要があります。  
改変版でMicrosoftの商標やロゴを使用する場合は、混乱を招いたり、Microsoftによる後援を示唆したりしないようにしてください。  
サードパーティの商標やロゴの使用は、それぞれのサードパーティのポリシーに従う必要があります。

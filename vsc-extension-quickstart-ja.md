# VS Code拡張機能へようこそ

## フォルダの内容

* このフォルダには、拡張機能に必要なすべてのファイルが含まれています。
* `package.json` - 拡張機能とコマンドを宣言するマニフェストファイルです。
  * サンプルプラグインは、コマンドを登録し、そのタイトルとコマンド名を定義します。この情報により、VS Codeはコマンドパレットにコマンドを表示できます。この時点ではまだプラグインをロードする必要はありません。
* `src/extension.ts` - コマンドの実装を提供する主要なファイルです。
  * このファイルは`activate`関数をエクスポートします。この関数は、拡張機能が最初にアクティブ化される際に呼び出されます（この場合はコマンドを実行することによって）。`activate`関数内で`registerCommand`を呼び出します。
  * コマンドの実装を含む関数を`registerCommand`の2番目のパラメータとして渡します。

## セットアップ

* 推奨拡張機能をインストールしてください（amodio.tsl-problem-matcher、ms-vscode.extension-test-runner、dbaeumer.vscode-eslint）

## すぐに始める

* `F5`を押して、拡張機能がロードされた新しいウィンドウを開きます。
* コマンドパレットから（`Ctrl+Shift+P`またはMacの場合は`Cmd+Shift+P`を押して）`Hello World`と入力してコマンドを実行します。
* `src/extension.ts`内にブレークポイントを設定して、拡張機能をデバッグできます。
* デバッグコンソールで拡張機能からの出力を確認できます。

## 変更を加える

* `src/extension.ts`のコードを変更した後、デバッグツールバーから拡張機能を再起動できます。
* また、VS Codeウィンドウをリロード（`Ctrl+R`またはMacの場合は`Cmd+R`）して、変更を読み込むこともできます。

## APIを探索する

* `node_modules/@types/vscode/index.d.ts`ファイルを開くと、完全なAPIセットを確認できます。

## テストの実行

* [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner)をインストールします
* **Tasks: Run Task**コマンドで"watch"タスクを実行します。これが実行されていないと、テストが検出されない可能性があります。
* アクティビティバーからテストビューを開き、"Run Test"ボタンをクリックするか、ホットキー`Ctrl/Cmd + ; A`を使用します。
* テスト結果をTest Resultsビューで確認します。
* `src/test/extension.test.ts`を変更するか、`test`フォルダ内に新しいテストファイルを作成します。
  * 提供されているテストランナーは、`**.test.ts`という名前のパターンに一致するファイルのみを対象とします。
  * `test`フォルダ内にフォルダを作成して、好きな方法でテストを構造化できます。

## さらに進める

* [拡張機能をバンドル化](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)して、拡張機能のサイズを削減し、起動時間を改善します。
* VS Code拡張機能マーケットプレイスで[拡張機能を公開](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)します。
* [継続的インテグレーション](https://code.visualstudio.com/api/working-with-extensions/continuous-integration)を設定してビルドを自動化します。

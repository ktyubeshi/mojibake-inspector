import * as vscode from 'vscode';
import * as path from 'path';

export class MojibakeWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'mojibakeView';
    private _view?: vscode.WebviewView;
    private _mojibakeItems: Map<string, vscode.Diagnostic[]> = new Map();

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // WebViewからのメッセージを処理
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case 'openFile':
                    const uri = vscode.Uri.file(data.filePath);
                    const document = await vscode.workspace.openTextDocument(uri);
                    const editor = await vscode.window.showTextDocument(document);
                    const position = new vscode.Position(data.line - 1, data.column - 1);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position));
                    break;
            }
        });

        // 状態を復元して表示を更新
        this._updateWebview();
    }

    public updateDiagnostics(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
        if (diagnostics.length > 0) {
            this._mojibakeItems.set(uri.fsPath, diagnostics);
        } else {
            this._mojibakeItems.delete(uri.fsPath);
        }
        this._updateWebview();
    }

    public clearAll() {
        this._mojibakeItems.clear();
        this._updateWebview();
    }

    private _updateWebview() {
        if (this._view) {
            const items: any[] = [];
            this._mojibakeItems.forEach((diagnostics, filePath) => {
                diagnostics.forEach(diagnostic => {
                    items.push({
                        filePath,
                        line: diagnostic.range.start.line + 1,
                        column: diagnostic.range.start.character + 1
                    });
                });
            });

            // 状態の保存と更新を1つのメッセージで送信
            this._view.webview.postMessage({
                command: 'updateMojibakeList',
                items,
                state: { items }
            });

            // バッジを更新
            const totalCount = items.length;
            this._view.badge = {
                value: totalCount,
                tooltip: totalCount > 0 ? `${totalCount}個の文字化けが見つかりました` : '文字化けは見つかりませんでした'
            };

            // タイトルを更新
            this._view.description = totalCount > 0 ? `${totalCount}` : undefined;
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <title>文字化け検出結果</title>
                <style>
                    :root {
                        --container-padding: 20px;
                        --input-padding-vertical: 6px;
                        --input-padding-horizontal: 4px;
                        --input-margin-vertical: 4px;
                        --input-margin-horizontal: 0;
                    }

                    body {
                        padding: 0 var(--container-padding);
                        color: var(--vscode-foreground);
                        font-size: var(--vscode-font-size);
                        font-weight: var(--vscode-font-weight);
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-editor-background);
                    }

                    .mojibake-list {
                        margin-top: 1rem;
                    }

                    .mojibake-item {
                        display: flex;
                        align-items: center;
                        padding: 8px;
                        margin-bottom: 8px;
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        cursor: pointer;
                    }

                    .mojibake-item:hover {
                        background-color: var(--vscode-list-hoverBackground);
                    }

                    .file-icon {
                        margin-right: 8px;
                        width: 16px;
                        height: 16px;
                    }

                    .file-info {
                        flex-grow: 1;
                    }

                    .file-path {
                        font-weight: bold;
                        margin-bottom: 4px;
                    }

                    .location {
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                    }

                    .warning-icon {
                        color: var(--vscode-list-warningForeground);
                        margin-right: 8px;
                    }

                    .count-badge {
                        background-color: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 6px;
                        border-radius: 10px;
                        font-size: 0.8em;
                    }

                    .no-results {
                        text-align: center;
                        padding: 2rem;
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="mojibake-list" id="mojibakeList">
                    <!-- 文字化け検出結果がここに動的に追加されます -->
                </div>

                <script nonce="${nonce}">
                    (function() {
                        const vscode = acquireVsCodeApi();
                        let currentItems = [];

                        function updateMojibakeList(items) {
                            currentItems = items;
                            const listElement = document.getElementById('mojibakeList');
                            listElement.innerHTML = '';

                            if (items.length === 0) {
                                listElement.innerHTML = '<div class="no-results">文字化けは見つかりませんでした</div>';
                                return;
                            }

                            const fileGroups = new Map();
                            items.forEach(item => {
                                if (!fileGroups.has(item.filePath)) {
                                    fileGroups.set(item.filePath, []);
                                }
                                fileGroups.get(item.filePath).push(item);
                            });

                            fileGroups.forEach((diagnostics, filePath) => {
                                const itemElement = document.createElement('div');
                                itemElement.className = 'mojibake-item';
                                itemElement.innerHTML = \`
                                    <span class="file-icon">📄</span>
                                    <div class="file-info">
                                        <div class="file-path">\${getFileName(filePath)}</div>
                                        <div class="location">\${filePath}</div>
                                        <div class="diagnostics">
                                            \${diagnostics.map(d => \`
                                                <div class="diagnostic">
                                                    <span class="warning-icon">⚠️</span>
                                                    行 \${d.line}, 列 \${d.column}
                                                </div>
                                            \`).join('')}
                                        </div>
                                    </div>
                                    <span class="count-badge">\${diagnostics.length}</span>
                                \`;

                                itemElement.addEventListener('click', () => {
                                    vscode.postMessage({
                                        command: 'openFile',
                                        filePath: filePath,
                                        line: diagnostics[0].line,
                                        column: diagnostics[0].column
                                    });
                                });

                                listElement.appendChild(itemElement);
                            });

                            // 状態を保存
                            vscode.setState({ items: currentItems });
                        }

                        function getFileName(filePath) {
                            return filePath.split(/[\\/]/).pop();
                        }

                        // メッセージハンドラーの設定
                        window.addEventListener('message', event => {
                            const message = event.data;
                            switch (message.command) {
                                case 'updateMojibakeList':
                                    updateMojibakeList(message.items);
                                    break;
                            }
                        });

                        // 初期状態を復元
                        const state = vscode.getState();
                        if (state && state.items) {
                            updateMojibakeList(state.items);
                        } else {
                            updateMojibakeList([]);
                        }
                    }())
                </script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
} 
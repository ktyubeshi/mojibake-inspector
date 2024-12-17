// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as path from 'path';
import { l10n } from 'vscode';
import * as fs from 'fs';
import { MojibakeWebviewProvider } from './webview/MojibakeWebviewProvider';

// 置換文字のデコレーション設定
const mojibakeDecoration = vscode.window.createTextEditorDecorationType({
	backgroundColor: 'rgba(255, 0, 0, 0.3)',
	border: '1px solid red',
	overviewRulerColor: 'red',
	overviewRulerLane: vscode.OverviewRulerLane.Right,
});

// Diagnosticsのコレクションを作成
const diagnosticCollection = vscode.languages.createDiagnosticCollection('mojibake');

// メッセージを関数として定義
const MOJIBAKE_CHAR = '�'; // U+FFFD
const getDiagnosticMessage = () => l10n.t('Detect U+FFFD (replacement character)');
const getHoverMessage = getDiagnosticMessage;

// 除外パターンを定数として定義
const DEFAULT_EXCLUDE_PATTERNS = [
	'**/.git/**',
	'**/node_modules/**',
	'**/.venv/**',
	'**/venv/**',
	'**/__pycache__/**',
	'**/bin/**',
	'**/obj/**',
	'**/dist/**',
	'**/out/**'
];

// デフォルト設定を定義
const DEFAULT_SETTINGS = {
	excludePatterns: DEFAULT_EXCLUDE_PATTERNS,
	showNoResultMessage: false,  // Not foundメッセージの表示制御
	report: {
		enabled: false,
		outputPath: 'mojibake-report.txt'
	}
};

// エラーコード定義
const ERROR_CODE = 'E001';
const ERROR_DESCRIPTION = 'U+FFFD (replacement character) detected';

// レポート出力インター��ェース
interface MojibakeReport {
	errorCode: string;
	filePath: string;
	line: number;
	column: number;
}

// レポートファイル出力関数
async function writeReport(reports: MojibakeReport[], reportPath: string) {
	const now = new Date();
	const dateStr = now.toLocaleString('ja-JP', {
		timeZone: 'Asia/Tokyo',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	});

	const header = `# Mojibake Inspector Report
# Generated: ${dateStr}
# Error Codes:
# ${ERROR_CODE}\t${ERROR_DESCRIPTION}\n`;

	let content = '';
	if (reports.length === 0) {
			content = 'No mojibake characters were found.\n';
	} else {
		content = 'ErrorCode\tFilePath\tLine\tColumn\n' +
			reports.map(report => 
				`${report.errorCode}\t${report.filePath}\t${report.line}\t${report.column}`
			).join('\n');
	}

	try {
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(reportPath),
			Buffer.from(header + content, 'utf8')
		);
		vscode.window.showInformationMessage(l10n.t('Report saved to: {0}', reportPath));
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		vscode.window.showErrorMessage(l10n.t('Failed to save report: {0}', errorMessage));
	}
}

// 既存のインターフェース定義の近くに追加
interface MojibakeResult {
	file: string;
	line: number;
	mojibake: string;
	encoding: string;
}

// 文字化けツリービューのアイテムクラス
class MojibakeTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
}

// 文字化けツリービューのデータプロバイダー
class MojibakeTreeDataProvider implements vscode.TreeDataProvider<MojibakeTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MojibakeTreeItem | undefined | null | void> = new vscode.EventEmitter<MojibakeTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MojibakeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private mojibakeItems: Map<string, vscode.Diagnostic[]> = new Map();
    private treeView?: vscode.TreeView<MojibakeTreeItem>;

    constructor(private context: vscode.ExtensionContext) {}

    setTreeView(treeView: vscode.TreeView<MojibakeTreeItem>) {
        this.treeView = treeView;
        this.updateTitle();
    }

    private updateTitle() {
        if (this.treeView) {
            let totalCount = 0;
            for (const diagnostics of this.mojibakeItems.values()) {
                totalCount += diagnostics.length;
            }
            // パネルのタイトルを更新
            vscode.commands.executeCommand('setContext', 'mojibakeInspector.count', totalCount);
            this.treeView.title = totalCount > 0 ? `文字化け (${totalCount})` : '文字化け';
            this.treeView.badge = {
                value: totalCount,
                tooltip: totalCount > 0 ? `${totalCount}個の文字化けが見つかりました` : '文字化けは見つかりませんでした'
            };
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
        this.updateTitle();
    }

    updateDiagnostics(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
        if (diagnostics.length > 0) {
            this.mojibakeItems.set(uri.fsPath, diagnostics);
        } else {
            this.mojibakeItems.delete(uri.fsPath);
        }
        this.refresh();
    }

    clearAll(): void {
        this.mojibakeItems.clear();
        this.refresh();
    }

    getTreeItem(element: MojibakeTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MojibakeTreeItem): Thenable<MojibakeTreeItem[]> {
        if (!element) {
            // ルートレベル：ファイル一覧を表示
            return Promise.resolve(Array.from(this.mojibakeItems.entries()).map(([filePath, diagnostics]) => {
                const fileName = path.basename(filePath);
                const treeItem = new MojibakeTreeItem(
                    `${fileName} (${diagnostics.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed
                );
                
                // ファイルアイコンを設定
                treeItem.resourceUri = vscode.Uri.file(filePath);
                treeItem.iconPath = vscode.ThemeIcon.File;
                
                return treeItem;
            }));
        } else {
            // ファイルの子要素：文字化けの詳細を表示
            const filePath = Array.from(this.mojibakeItems.keys()).find(key => 
                element.label.startsWith(path.basename(key)));
            
            if (filePath) {
                const diagnostics = this.mojibakeItems.get(filePath) || [];
                return Promise.resolve(diagnostics.map(diagnostic => {
                    const range = diagnostic.range;
                    const label = `行 ${range.start.line + 1}, 列 ${range.start.character + 1}`;
                    const treeItem = new MojibakeTreeItem(
                        label,
                        vscode.TreeItemCollapsibleState.None,
                        {
                            command: 'vscode.open',
                            title: 'Open File',
                            arguments: [
                                vscode.Uri.file(filePath),
                                { selection: range }
                            ]
                        }
                    );
                    
                    // 文字化け位置のアイコンを設定
                    treeItem.iconPath = new vscode.ThemeIcon('warning');
                    
                    return treeItem;
                }));
            }
            return Promise.resolve([]);
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
	try {
		console.log('Activating Mojibake Inspector extension...');
		console.log('Extension path:', context.extensionPath);
		console.log('L10n bundle path:', path.join(context.extensionPath, 'l10n'));

		// WebViewプロバイダーの初期化
		const mojibakeWebviewProvider = new MojibakeWebviewProvider(context.extensionUri);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(
				MojibakeWebviewProvider.viewType,
				mojibakeWebviewProvider
			)
		);
		
		// 既存のDiagnosticsコレクションを更新する際にWebViewも更新
		const originalSet = diagnosticCollection.set.bind(diagnosticCollection);
		diagnosticCollection.set = function(
			uriOrEntries: vscode.Uri | readonly [vscode.Uri, readonly vscode.Diagnostic[] | undefined][],
			diagnostics?: readonly vscode.Diagnostic[] | undefined
		): void {
			if (uriOrEntries instanceof vscode.Uri) {
				// 単一のURIとDiagnosticsのケース
				originalSet(uriOrEntries, diagnostics);
				if (diagnostics) {
					mojibakeWebviewProvider.updateDiagnostics(uriOrEntries, Array.from(diagnostics));
				} else {
					mojibakeWebviewProvider.updateDiagnostics(uriOrEntries, []);
				}
			} else {
				// 複数エントリのケース
				originalSet(uriOrEntries);
				for (const [uri, diags] of uriOrEntries) {
					if (diags) {
						mojibakeWebviewProvider.updateDiagnostics(uri, Array.from(diags));
					} else {
						mojibakeWebviewProvider.updateDiagnostics(uri, []);
					}
				}
			}
		};
		
		const originalClear = diagnosticCollection.clear.bind(diagnosticCollection);
		diagnosticCollection.clear = function(): void {
			originalClear();
			mojibakeWebviewProvider.clearAll();
		};

		// 設定変更を監視
		context.subscriptions.push(
			vscode.workspace.onDidChangeConfiguration(event => {
				if (event.affectsConfiguration('mojibakeInspector')) {
					// 現在のエディタがある場合は再検査
					const editor = vscode.window.activeTextEditor;
					if (editor) {
						findReplacementCharacters(editor, false);
					}
					// ワークスペース全体を再検査（レポート生成なし）
					findReplacementCharactersInWorkspace(false);
				}
				if (event.affectsConfiguration('mojibakeInspector.showMojibakeView')) {
					// ビューの表示/非表設定が変更された場合の処理
					const config = vscode.workspace.getConfiguration('mojibakeInspector');
					const showView = config.get<boolean>('showMojibakeView', true);
					vscode.commands.executeCommand('setContext', 'config.mojibakeInspector.showMojibakeView', showView);
				}
			})
		);

		// コディタの変更を監視
		context.subscriptions.push(
			vscode.window.onDidChangeActiveTextEditor(editor => {
				if (editor) {
					findReplacementCharacters(editor, false);
				}
			})
		);

		// テキストの変更を監視
		context.subscriptions.push(
			vscode.workspace.onDidChangeTextDocument(event => {
				const editor = vscode.window.activeTextEditor;
				if (editor && event.document === editor.document) {
					findReplacementCharacters(editor, false);
				}
			})
		);

		// コマンドの登録
		context.subscriptions.push(
			vscode.commands.registerCommand('extension.findReplacementCharacters', async () => {
				const choice = await vscode.window.showQuickPick(
					[
						{
							label: l10n.t('Current File'),
							description: l10n.t('Search in the current file only')
						},
						{
							label: l10n.t('Workspace'),
							description: l10n.t('Search in all files in the workspace')
						}
					],
					{
						placeHolder: l10n.t('Select search scope')
					}
				);

				if (!choice) {
					return;
				}

				if (choice.label === l10n.t('Current File')) {
					const editor = vscode.window.activeTextEditor;
					if (!editor) {
						vscode.window.showInformationMessage(l10n.t('No active text editor'));
						return;
					}
					findReplacementCharacters(editor, true);
				} else {
					// ユーザーによるワークスペース検査時はレポートを生成
					await findReplacementCharactersInWorkspace(true);
				}
			})
		);

		context.subscriptions.push(diagnosticCollection);
		console.log('Mojibake Inspector extension activated successfully');
	} catch (error) {
		console.error('Error during extension activation:', error);
		vscode.window.showErrorMessage(`Failed to activate Mojibake Inspector: ${error instanceof Error ? error.message : String(error)}`);
		throw error;
	}
}

function findReplacementCharacters(editor: vscode.TextEditor, showMessage: boolean = false) {
	const text = editor.document.getText();
	const replacementCharRegex = /\uFFFD/g;
	const decorations: vscode.DecorationOptions[] = [];
	const diagnostics: vscode.Diagnostic[] = [];
	const config = vscode.workspace.getConfiguration('mojibakeInspector');
	const showNoResultMessage = config.get<boolean>('showNoResultMessage', DEFAULT_SETTINGS.showNoResultMessage);

	let match;
	while ((match = replacementCharRegex.exec(text)) !== null) {
		const startPos = editor.document.positionAt(match.index);
		const endPos = editor.document.positionAt(match.index + 1);
		const range = new vscode.Range(startPos, endPos);
		
		// デコレーション用
		const decoration = {
			range,
			hoverMessage: getHoverMessage()
		};
		decorations.push(decoration);

		// Diagnostic用
		const diagnostic = new vscode.Diagnostic(
				range,
				getDiagnosticMessage(),
				vscode.DiagnosticSeverity.Warning
		);
		diagnostic.code = 'mojibake';
		diagnostics.push(diagnostic);
	}

	// デコレーションを適用
	editor.setDecorations(mojibakeDecoration, decorations);

	// Diagnosticsを設定
	diagnosticCollection.set(editor.document.uri, diagnostics);

	// メッセージ表示はshowMessageがtrueの場合のみ
	if (showMessage) {
		const count = decorations.length;
		if (count > 0) {
			vscode.window.showInformationMessage(
				vscode.l10n.t('extension.replacementCharacterFound', count)
			);
		} else if (showNoResultMessage) {
			vscode.window.showInformationMessage(
				vscode.l10n.t('No {0} found', MOJIBAKE_CHAR)
			);
		}
	}
}

async function findReplacementCharactersInWorkspace(generateReport: boolean = true) {
	// ワークスペースの設定から除外パターンを取得（設定ない場合はデフォルトを使用）
	const config = vscode.workspace.getConfiguration('mojibakeInspector');
	const excludePatterns = config.get<string[]>('excludePatterns', DEFAULT_SETTINGS.excludePatterns);
	const showNoResultMessage = config.get<boolean>('showNoResultMessage', DEFAULT_SETTINGS.showNoResultMessage);
	const reportConfig = generateReport ? {
		enabled: config.get<boolean>('report.enabled', DEFAULT_SETTINGS.report.enabled),
		outputPath: config.get<string>('report.outputPath', DEFAULT_SETTINGS.report.outputPath)
	} : {
		enabled: false,
		outputPath: ''
	};
	const reports: MojibakeReport[] = [];
	
	const progress = await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: l10n.t('Searching for replacement characters...'),
		cancellable: true
	}, async (progress, token) => {
		let totalCount = 0;
		const files = await vscode.workspace.findFiles('**/*', `{${excludePatterns.join(',')}}`);
		
		// 全てのDiagnosticsをクリア
		diagnosticCollection.clear();

		for (const file of files) {
			if (token.isCancellationRequested) {
				break;
			}

			try {
				const document = await vscode.workspace.openTextDocument(file);
				const text = document.getText();
				const replacementCharRegex = /\uFFFD/g;
				const diagnostics: vscode.Diagnostic[] = [];

				let match;
				while ((match = replacementCharRegex.exec(text)) !== null) {
					const startPos = document.positionAt(match.index);
					const endPos = document.positionAt(match.index + 1);
					const range = new vscode.Range(startPos, endPos);

					const diagnostic = new vscode.Diagnostic(
						range,
						getDiagnosticMessage(),
						vscode.DiagnosticSeverity.Warning
					);
					diagnostic.code = 'mojibake';
					diagnostics.push(diagnostic);
					
					if (reportConfig.enabled) {
						const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
						const relativePath = workspaceFolder 
							? path.relative(workspaceFolder.uri.fsPath, document.uri.fsPath)
							: document.uri.fsPath;
						
						reports.push({
							errorCode: ERROR_CODE,
							filePath: relativePath,
							line: startPos.line + 1,
							column: startPos.character + 1
						});
					}
					
					totalCount++;
				}

				if (diagnostics.length > 0) {
					diagnosticCollection.set(document.uri, diagnostics);
				}

				progress.report({
					message: l10n.t('Checking {0}...', document.fileName)
				});
			} catch (error) {
				console.error(`Error processing file ${file.fsPath}:`, error);
			}
		}

		return totalCount;
	});

	// レポートファイルの出力
	if (reportConfig.enabled) {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (workspaceFolder) {
			const reportPath = path.join(workspaceFolder.uri.fsPath, reportConfig.outputPath);
			await writeReport(reports, reportPath);
		}
	}

	// 結果を表示
	if (progress > 0) {
		vscode.window.showInformationMessage(
			vscode.l10n.t('extension.replacementCharacterFound', progress)
		);
	} else if (showNoResultMessage) {
		vscode.window.showInformationMessage(
			vscode.l10n.t('No \'{0}\' found in workspace', MOJIBAKE_CHAR)
		);
	}
}

export function deactivate() {
	try {
		console.log('Deactivating Mojibake Inspector extension...');
		diagnosticCollection.clear();
		diagnosticCollection.dispose();
	} catch (error) {
		console.error('Error during extension deactivation:', error);
	}
}

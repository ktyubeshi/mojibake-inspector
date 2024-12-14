// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as path from 'path';
import { l10n } from 'vscode';

// 置換文字のデコレーション設定
const mojibakeDecoration = vscode.window.createTextEditorDecorationType({
	backgroundColor: 'rgba(255, 0, 0, 0.3)',
	border: '1px solid red',
	overviewRulerColor: 'red',
	overviewRulerLane: vscode.OverviewRulerLane.Right,
});

// Diagnosticsのコレクションを作成
const diagnosticCollection = vscode.languages.createDiagnosticCollection('mojibake');

// メッセージを定数として定義
const MOJIBAKE_CHAR = ''; // U+FFFD
const DIAGNOSTIC_MESSAGE = `Detect U+FFFD (replacement character)`;
const HOVER_MESSAGE = DIAGNOSTIC_MESSAGE;

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

export function activate(context: vscode.ExtensionContext) {
	try {
		console.log('Activating Mojibake Inspector extension...');
		console.log('Extension path:', context.extensionPath);
		console.log('L10n bundle path:', path.join(context.extensionPath, 'l10n'));

		// コディタの変更を監視
		context.subscriptions.push(
			vscode.window.onDidChangeActiveTextEditor(editor => {
				if (editor) {
					findReplacementCharacters(editor);
				}
			})
		);

		// テキストの変更を監視
		context.subscriptions.push(
			vscode.workspace.onDidChangeTextDocument(event => {
				const editor = vscode.window.activeTextEditor;
				if (editor && event.document === editor.document) {
					findReplacementCharacters(editor);
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
					findReplacementCharacters(editor);
				} else {
					await findReplacementCharactersInWorkspace();
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

function findReplacementCharacters(editor: vscode.TextEditor) {
	const text = editor.document.getText();
	const replacementCharRegex = /\uFFFD/g;
	const decorations: vscode.DecorationOptions[] = [];
	const diagnostics: vscode.Diagnostic[] = [];

	let match;
	while ((match = replacementCharRegex.exec(text)) !== null) {
		const startPos = editor.document.positionAt(match.index);
		const endPos = editor.document.positionAt(match.index + 1);
		const range = new vscode.Range(startPos, endPos);
		
		// デコレーション用
		const decoration = {
			range,
			hoverMessage: l10n.t(HOVER_MESSAGE)
		};
		decorations.push(decoration);

		// Diagnostic用
		const diagnostic = new vscode.Diagnostic(
			range,
			l10n.t(DIAGNOSTIC_MESSAGE),
			vscode.DiagnosticSeverity.Warning
		);
		diagnostic.code = 'mojibake';
		diagnostics.push(diagnostic);
	}

	// デコレーションを適用
	editor.setDecorations(mojibakeDecoration, decorations);

	// Diagnosticsを設定
	diagnosticCollection.set(editor.document.uri, diagnostics);

	// 結果を表示
	const count = decorations.length;
	if (count > 0) {
		vscode.window.showInformationMessage(
			vscode.l10n.t('extension.replacementCharacterFound', count)
		);
	} else {
		vscode.window.showInformationMessage(
			vscode.l10n.t('No {0} found', MOJIBAKE_CHAR)
		);
	}
}

async function findReplacementCharactersInWorkspace() {
	// ワークスペースの設定から除外パターンを取得（設定がない場合はデフォルトを使用）
	const config = vscode.workspace.getConfiguration('mojibakeInspector');
	const excludePatterns = config.get<string[]>('excludePatterns', DEFAULT_EXCLUDE_PATTERNS);
	
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
						l10n.t(DIAGNOSTIC_MESSAGE),
						vscode.DiagnosticSeverity.Warning
					);
					diagnostic.code = 'mojibake';
					diagnostics.push(diagnostic);
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

	// 結果を表示
	if (progress > 0) {
		vscode.window.showInformationMessage(
			vscode.l10n.t('extension.replacementCharacterFound', progress)
		);
	} else {
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

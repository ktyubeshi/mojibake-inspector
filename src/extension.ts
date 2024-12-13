// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// 文字化けを検出する関数
function detectMojibake(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection) {
	const text = document.getText();
	const replacementChar = '\uFFFD'; // U+FFFD (REPLACEMENT CHARACTER)
	const diagnostics: vscode.Diagnostic[] = [];

	// 文字化け文字を検索
	let index = text.indexOf(replacementChar);
	while (index !== -1) {
		const position = document.positionAt(index);
		const range = new vscode.Range(position, position.translate(0, 1));
		const diag = new vscode.Diagnostic(
			range,
			'Mojibake detected (U+FFFD REPLACEMENT CHARACTER)\nPlease check the file encoding.',
			vscode.DiagnosticSeverity.Warning
		);
		diag.source = 'Mojibake Inspector';
		diag.code = 'MOJIBAKE_FFFD';
		
		diagnostics.push(diag);

		index = text.indexOf(replacementChar, index + 1);
	}

	// 診断情報を設定
	diagnosticCollection.set(document.uri, diagnostics);

	// 結果を表示（コマンドから実行された場合のみ）
	return diagnostics.length;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// 診断情報を管理するコレクションを作成
	let diagnosticCollection = vscode.languages.createDiagnosticCollection('mojibakeInspector');
	context.subscriptions.push(diagnosticCollection);

	// ファイルの変更を監視
	let changeTextDisposable = vscode.workspace.onDidChangeTextDocument(event => {
		const document = event.document;
		detectMojibake(document, diagnosticCollection);
	});
	context.subscriptions.push(changeTextDisposable);

	// アクティブなエディタの変更を監視
	let activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			detectMojibake(editor.document, diagnosticCollection);
		}
	});
	context.subscriptions.push(activeEditorDisposable);

	// 初期チェック
	if (vscode.window.activeTextEditor) {
		detectMojibake(vscode.window.activeTextEditor.document, diagnosticCollection);
	}

	// コマンドを登録（手動チェック用）
	let commandDisposable = vscode.commands.registerCommand('extension.findReplacementCharacters', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor');
			return;
		}

		const count = detectMojibake(editor.document, diagnosticCollection);
		
		// 結果を表示
		if (count === 0) {
			vscode.window.showInformationMessage('No mojibake characters found.');
		} else {
			vscode.window.showInformationMessage(
				vscode.l10n.t('{0} mojibake characters found.', count)
			);
		}
	});

	context.subscriptions.push(commandDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

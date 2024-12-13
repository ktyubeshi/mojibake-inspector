// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// 診断情報を管理するコレクションを作成
	let diagnosticCollection = vscode.languages.createDiagnosticCollection('mojibakeInspector');
	context.subscriptions.push(diagnosticCollection);

	// コマンドを登録
	let disposable = vscode.commands.registerCommand('extension.findReplacementCharacters', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor');
			return;
		}

		const document = editor.document;
		const text = document.getText();
		const replacementChar = '\uFFFD'; // U+FFFD � (REPLACEMENT CHARACTER)
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

		// 結果を表示
		if (diagnostics.length === 0) {
			vscode.window.showInformationMessage('No mojibake characters found.');
		} else {
			vscode.window.showInformationMessage(
				vscode.l10n.t('{0} mojibake characters found.', diagnostics.length)
			);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

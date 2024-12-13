import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Mojibake Inspector Test Suite', () => {
	vscode.window.showInformationMessage('文字化け検出テストを開始します。');

	test('文字化け文字（U+FFFD）の検出テスト', async () => {
		// テスト用のテキストを含む一時ファイルを作成
		const testContent = 'Normal text with replacement character \uFFFD in it';
		const document = await vscode.workspace.openTextDocument({
			content: testContent,
			language: 'plaintext'
		});

		// エディタでファイルを開く
		const editor = await vscode.window.showTextDocument(document);

		// コマンドを実行
		await vscode.commands.executeCommand('extension.findReplacementCharacters');

		// 診断情報を取得
		const diagnostics = vscode.languages.getDiagnostics(document.uri);

		// 検証
		assert.strictEqual(diagnostics.length, 1, '1つの文字化けが検出されるべき');
		assert.strictEqual(diagnostics[0].code, 'MOJIBAKE_FFFD', '正しい診断コード');
		assert.strictEqual(diagnostics[0].severity, vscode.DiagnosticSeverity.Warning, '警告レベルの診断');
	});

	test('文字化けのない正常なテキストのテスト', async () => {
		// 正常なテキストでテスト
		const normalContent = 'This is normal text without any replacement characters.';
		const document = await vscode.workspace.openTextDocument({
			content: normalContent,
			language: 'plaintext'
		});

		const editor = await vscode.window.showTextDocument(document);
		await vscode.commands.executeCommand('extension.findReplacementCharacters');

		const diagnostics = vscode.languages.getDiagnostics(document.uri);
		assert.strictEqual(diagnostics.length, 0, '文字化けは検出されないべき');
	});
});

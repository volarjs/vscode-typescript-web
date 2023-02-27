import { LanguageServerInitializationOptions } from '@volar/language-server';
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient/browser';
import {
	activateTsVersionStatusItem,
	activateFindFileReferences,
	activateReloadProjects,
	activateServerSys,
	getTsdk,
} from '@volar/vscode-language-client';

let client: lsp.BaseLanguageClient | undefined;

class _LanguageClient extends lsp.LanguageClient {
	fillInitializeParams(params: lsp.InitializeParams) {
		if (params.capabilities.textDocument) {
			params.capabilities.textDocument.selectionRange = undefined;
			params.capabilities.textDocument.foldingRange = undefined;
			params.capabilities.textDocument.linkedEditingRange = undefined;
			params.capabilities.textDocument.documentSymbol = undefined;
			params.capabilities.textDocument.colorProvider = undefined;
			params.capabilities.textDocument.formatting = undefined;
			params.capabilities.textDocument.rangeFormatting = undefined;
			params.capabilities.textDocument.onTypeFormatting = undefined;
		}
	}
}

export async function activate(context: vscode.ExtensionContext) {

	const serverMain = vscode.Uri.joinPath(context.extensionUri, 'dist/server.js');
	const worker = new Worker(serverMain.toString());
	const clientOptions: lsp.LanguageClientOptions = {
		documentSelector: [
			{ language: 'typescript' },
			{ language: 'typescriptreact' },
			{ language: 'javascript' },
			{ language: 'javascriptreact' },
		],
		initializationOptions: {
			respectClientCapabilities: true,
			typescript: {
				tsdk: getTsdk(context).tsdk,
			},
		} satisfies LanguageServerInitializationOptions,
	};
	client = new _LanguageClient(
		'typescript-web',
		'TypeScript IntelliSense for Web',
		clientOptions,
		worker,
	);
	await client.start();

	activateTsVersionStatusItem(
		'typescript-web-ts-version',
		context,
		client,
		document => [
			'typescript',
			'typescriptreact',
			'javascript',
			'javascriptreact',
		].includes(document.languageId),
		text => `${text} (volar)`,
		true,
	);
	activateFindFileReferences('typescript-web-find-file-references', client);
	activateReloadProjects('typescript-web-reload-projects', [client]);
	activateServerSys(context, client);
}

export function deactivate() {
	return client?.stop();
}

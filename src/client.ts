import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient/browser';
import {
	activateTsVersionStatusItem,
	activateFindFileReferences,
	activateReloadProjects,
	activateServerSys,
	activateAutoInsertion,
	getTsdk,
} from '@volar/vscode-language-client';
import type { TypeScriptWebServerOptions } from './types';

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

	const configs = getConfigs();
	const serverMain = vscode.Uri.joinPath(context.extensionUri, 'dist/server.js');
	const worker = new Worker(serverMain.toString());
	const documentSelector: lsp.DocumentSelector = [
		{ language: 'typescript' },
		{ language: 'typescriptreact' },
		{ language: 'javascript' },
		{ language: 'javascriptreact' },
	];
	const documentFilter = (document: vscode.TextDocument): boolean => [
		'typescript',
		'typescriptreact',
		'javascript',
		'javascriptreact',
		configs.supportVue ? 'vue' : undefined,
	].includes(document.languageId);

	if (configs.supportVue) {
		documentSelector.push({ language: 'vue' });
	}

	console.log(documentSelector);

	const clientOptions: lsp.LanguageClientOptions = {
		documentSelector,
		initializationOptions: {
			respectClientCapabilities: true,
			typescript: {
				tsdk: getTsdk(context).tsdk,
				versions: configs.versions,
				cdn: configs.cdn,
			},
			supportVue: configs.supportVue,
		} satisfies TypeScriptWebServerOptions,
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
		documentFilter,
		text => `${text} (volar)`,
		true,
		configs.cdn,
	);
	activateFindFileReferences('typescript-web.find-file-references', client);
	activateReloadProjects('typescript-web.reload-projects', [client]);
	activateServerSys(context, client);
	activateAutoInsertion([client], documentFilter);
}

export function deactivate() {
	return client?.stop();
}

function getConfigs() {
	const configs = vscode.workspace.getConfiguration('typescript-web');
	return {
		cdn: configs.get<string>('packages.cdn'),
		// fix: Failed to execute 'postMessage' on 'Worker': #<Object> could not be cloned.
		versions: JSON.parse(JSON.stringify(configs.get<Record<string, string>>('packages.versions'))),
		supportVue: configs.get<boolean>('supportVue') ?? false,
	};
}

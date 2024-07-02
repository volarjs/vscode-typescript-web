import {
	activateAutoInsertion,
	activateFindFileReferences,
	activateReloadProjects,
	activateServerSys,
	activateTsConfigStatusItem,
} from '@volar/vscode';
import * as lsp from '@volar/vscode/browser';
import * as vscode from 'vscode';
import type { TypeScriptWebServerOptions } from './types';

let client: lsp.BaseLanguageClient | undefined;

export async function activate(context: vscode.ExtensionContext) {

	const configs = getConfigs();
	const serverMain = vscode.Uri.joinPath(context.extensionUri, 'dist/server.js');
	const worker = new Worker(serverMain.toString());
	const documentSelector: lsp.DocumentSelector = [
		'typescript',
		'typescriptreact',
		'javascript',
		'javascriptreact',
	];
	if (configs.supportVue) documentSelector.push('vue');

	const clientOptions: lsp.LanguageClientOptions = {
		documentSelector,
		initializationOptions: {
			typescript: {
				tsdkUrl: 'https://cdn.jsdelivr.net/npm/typescript@latest/lib',
			},
			versions: configs.versions,
			globalModules: configs.globalModules,
			supportVue: configs.supportVue,
		} satisfies TypeScriptWebServerOptions,
	};
	client = new lsp.LanguageClient(
		'typescript-web',
		'TypeScript IntelliSense for Web',
		clientOptions,
		worker,
	);
	await client.start();

	activateFindFileReferences('typescript-web.find-file-references', client);
	activateReloadProjects('typescript-web.reload-projects', client);
	activateServerSys(client);
	activateAutoInsertion(documentSelector, client);
	activateTsConfigStatusItem(documentSelector, 'typescript-web.tsconfig', client);

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider('vscode-typescript-web', {
			provideTextDocumentContent(uri: vscode.Uri) {
				if (uri.authority === 'cdn') {
					return client?.sendRequest<string>('$/cdnFileContent', uri.toString());
				}
			},
		})
	);
}

export function deactivate() {
	return client?.stop();
}

function getConfigs() {
	const configs = vscode.workspace.getConfiguration('typescript-web');
	return {
		// fix: Failed to execute 'postMessage' on 'Worker': #<Object> could not be cloned.
		versions: JSON.parse(JSON.stringify(configs.get<Record<string, string>>('dts.versions'))),
		globalModules: configs.get<string[]>('dts.globals'),
		supportVue: configs.get<boolean>('supportVue') ?? false,
	};
}

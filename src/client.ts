import * as vscode from 'vscode';
import {
	activateFindFileReferences,
	activateReloadProjects,
	activateServerSys,
	activateAutoInsertion,
	activateTsConfigStatusItem,
} from '@volar/vscode';
import * as lsp from '@volar/vscode/browser';
import type { TypeScriptWebServerOptions } from './types';

let client: lsp.BaseLanguageClient | undefined;

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
		configs.supportAstro ? 'astro' : undefined,
	].includes(document.languageId);

	if (configs.supportVue) documentSelector.push({ language: 'vue' });
	if (configs.supportAstro) documentSelector.push({ language: 'astro' });

	const clientOptions: lsp.LanguageClientOptions = {
		documentSelector,
		initializationOptions: {
			typescript: {
				tsdkUrl: 'https://cdn.jsdelivr.net/npm/typescript@latest/lib',
			},
			versions: configs.versions,
			globalModules: configs.globalModules,
			supportVue: configs.supportVue,
			supportAstro: configs.supportAstro,
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
	activateReloadProjects('typescript-web.reload-projects', [client]);
	activateServerSys(client);
	activateAutoInsertion([client], documentFilter);
	activateTsConfigStatusItem('typescript-web.tsconfig', client, documentFilter);
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
		supportAstro: configs.get<boolean>('supportAstro') ?? false,
	};
}

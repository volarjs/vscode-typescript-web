import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient/browser';
import {
	activateTsVersionStatusItem,
	activateFindFileReferences,
	activateReloadProjects,
	activateServerSys,
	activateAutoInsertion,
	activateTsConfigStatusItem,
	getTsdk,
} from '@volar/vscode';
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
				tsdk: (await getTsdk(context)).tsdk,
			},
			versions: configs.versions,
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

	activateTsVersionStatusItem(
		'typescript-web.ts-version',
		context,
		client,
		documentFilter,
		text => {
			const langs: string[] = [];

			if (configs.supportVue) langs.push('vue');
			if (configs.supportAstro) langs.push('astro');

			return langs.length ? `${text} (${langs.join(', ')})` : text;
		},
		true,
	);
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
		supportVue: configs.get<boolean>('supportVue') ?? false,
		supportAstro: configs.get<boolean>('supportAstro') ?? false,
	};
}

import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient/browser';
import {
	activateTsVersionStatusItem,
	activateFindFileReferences,
	activateReloadProjects,
	activateServerSys,
	activateAutoInsertion,
	activateTsConfigStatusItem,
	activateShowVirtualFiles,
	getTsdk,
} from '@volar/vscode-language-client';
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
		configs.supportSvelte ? 'svelte' : undefined,
		configs.supportAngular ? 'html' : undefined,
		configs.supportMdx ? 'mdx' : undefined,
	].includes(document.languageId);

	if (configs.supportVue) documentSelector.push({ language: 'vue' });
	if (configs.supportSvelte) documentSelector.push({ language: 'svelte' });
	if (configs.supportAngular) documentSelector.push({ language: 'html' });
	if (configs.supportMdx) documentSelector.push({ language: 'mdx' });

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
			supportSvelte: configs.supportSvelte,
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
			if (configs.supportSvelte) langs.push('svelte');
			if (configs.supportAngular) langs.push('angular');
			if (configs.supportMdx) langs.push('mdx');

			return langs.length ? `${text} (${langs.join(', ')})` : text;
		},
		true,
		configs.cdn,
	);
	activateFindFileReferences('typescript-web.find-file-references', client);
	activateReloadProjects('typescript-web.reload-projects', [client]);
	activateServerSys(context, client, configs.cdn);
	activateAutoInsertion([client], documentFilter);
	activateShowVirtualFiles('typescript-web.show-virtual-files', client);
	activateTsConfigStatusItem('typescript-web.tsconfig', client, documentFilter);
}

export function deactivate() {
	return client?.stop();
}

function getConfigs() {
	const configs = vscode.workspace.getConfiguration('typescript-web');
	return {
		cdn: configs.get<string>('dts.cdn'),
		// fix: Failed to execute 'postMessage' on 'Worker': #<Object> could not be cloned.
		versions: JSON.parse(JSON.stringify(configs.get<Record<string, string>>('dts.versions'))),
		supportVue: configs.get<boolean>('supportVue') ?? false,
		supportSvelte: configs.get<boolean>('supportSvelte') ?? false,
		supportAngular: configs.get<boolean>('supportAngular') ?? false,
		supportMdx: configs.get<boolean>('supportMdx') ?? false,
	};
}

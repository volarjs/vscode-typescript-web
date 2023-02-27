import * as createTsPlugin from '@volar-plugins/typescript';
import { createConnection, startLanguageServer, LanguageServerPlugin } from '@volar/language-server/browser';
import * as vue from '@volar/vue-language-service';
import * as vueCore from '@volar/vue-language-core';
import { TypeScriptWebServerOptions } from './types';
import type * as ts from 'typescript/lib/tsserverlibrary';

const connection = createConnection();

const plugin: LanguageServerPlugin = (options: TypeScriptWebServerOptions): ReturnType<LanguageServerPlugin> => {

	// typescript
	const exts = ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'jsx', 'tsx', 'json'];
	const documentSelector: vue.DocumentSelector = [
		{ language: 'javascript' },
		{ language: 'typescript' },
		{ language: 'javascriptreact' },
		{ language: 'typescriptreact' },
	];
	const extraFileExtensions: ts.FileExtensionInfo[] = [];

	// vue
	if (options.supportVue) {
		exts.push('vue');
		documentSelector.push({ language: 'vue' });
		extraFileExtensions.push({ extension: 'vue', isMixedContent: true, scriptKind: 7 });
	}

	return {
		tsconfigExtraFileExtensions: extraFileExtensions,
		diagnosticDocumentSelector: documentSelector,
		extensions: {
			fileRenameOperationFilter: exts,
			fileWatcher: exts,
		},
		resolveConfig(config, ctx) {

			// base
			config.plugins ??= {};
			config.plugins.typescript ??= createTsPlugin();

			const ts = ctx.project.workspace.workspaces.ts;

			// ts
			if (options.supportVue && ts) {

				let vueOptions: Partial<vue.VueCompilerOptions> = {};
				if (typeof ctx.project.tsConfig === 'string') {
					vueOptions = vueCore.createParsedCommandLine(ts, ctx.sys, ctx.project.tsConfig, []).vueOptions;
				}

				vue.resolveConfig(
					config,
					ts,
					ctx.host.getCompilationSettings(),
					vueOptions,
				);
			}
		},
	}
};

startLanguageServer(connection, plugin);

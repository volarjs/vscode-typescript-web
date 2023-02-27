import * as createTsPlugin from '@volar-plugins/typescript';
import { createConnection, startLanguageServer, LanguageServerPlugin } from '@volar/language-server/browser';
import { TypeScriptWebServerOptions } from './types';

const connection = createConnection();
const emptyPluginInstance: ReturnType<LanguageServerPlugin> = {
	tsconfigExtraFileExtensions: [],
	diagnosticDocumentSelector: [],
	extensions: {
		fileRenameOperationFilter: [],
		fileWatcher: [],
	},
	resolveConfig() { },
};

/**
 * Base TypeScript plugin
 */

const baseExts = ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'jsx', 'tsx', 'json'];
const basePlugin: LanguageServerPlugin = (): ReturnType<LanguageServerPlugin> => {
	return {
		tsconfigExtraFileExtensions: [],
		diagnosticDocumentSelector: [
			{ language: 'javascript' },
			{ language: 'typescript' },
			{ language: 'javascriptreact' },
			{ language: 'typescriptreact' },
		],
		extensions: {
			fileRenameOperationFilter: baseExts,
			fileWatcher: baseExts,
		},
		resolveConfig(config) {
			config.plugins ??= {};
			config.plugins.typescript ??= createTsPlugin();
		},
	}
};

/**
 * Vue plugin
 */

import * as vue from '@volar/vue-language-service';
import * as vueCore from '@volar/vue-language-core';

const vuePlugin: LanguageServerPlugin = (options: TypeScriptWebServerOptions): ReturnType<LanguageServerPlugin> => {
	if (!options.supportVue) {
		return emptyPluginInstance;
	}
	return {
		tsconfigExtraFileExtensions: [{ extension: 'vue', isMixedContent: true, scriptKind: 7 }],
		diagnosticDocumentSelector: [{ language: 'vue' }],
		extensions: {
			fileRenameOperationFilter: ['vue'],
			fileWatcher: ['vue'],
		},
		resolveConfig(config, ctx) {

			const ts = ctx.project.workspace.workspaces.ts;
			if (!ts || !options.supportVue) {
				return;
			}

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
		},
	};
};

/**
 * Svelte plugin
 */

import * as svelte from '@volar-examples/svelte-language-core';

const sveltePlugin: LanguageServerPlugin = (options: TypeScriptWebServerOptions): ReturnType<LanguageServerPlugin> => {
	if (!options.supportSvelte) {
		return emptyPluginInstance;
	}
	return {
		tsconfigExtraFileExtensions: [{ extension: 'svelte', isMixedContent: true, scriptKind: 7 }],
		diagnosticDocumentSelector: [{ language: 'svelte' }],
		extensions: {
			fileRenameOperationFilter: ['svelte'],
			fileWatcher: ['svelte'],
		},
		resolveConfig(config) {
			config.languages ??= {};
			config.languages.svelte ??= svelte.languageModule;
		},
	};
};

startLanguageServer(
	connection,
	basePlugin,
	vuePlugin,
	sveltePlugin,
);

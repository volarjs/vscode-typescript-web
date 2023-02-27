import * as createTsPlugin from '@volar-plugins/typescript';
import { createConnection, startLanguageServer, LanguageServerPlugin } from '@volar/language-server/browser';
import * as vue from '@volar/vue-language-service';
import * as vueCore from '@volar/vue-language-core';
import { TypeScriptWebServerOptions } from './types';

const connection = createConnection();
const baseExts = ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'jsx', 'tsx', 'json'];
const emptyPluginInstance: ReturnType<LanguageServerPlugin> = {
	tsconfigExtraFileExtensions: [],
	diagnosticDocumentSelector: [],
	extensions: {
		fileRenameOperationFilter: [],
		fileWatcher: [],
	},
	resolveConfig() { },
};

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

const vuePlugin: LanguageServerPlugin = (options: TypeScriptWebServerOptions): ReturnType<LanguageServerPlugin> => {
	if (!options.supportVue) {
		return emptyPluginInstance;
	}
	else {
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
	}
};

startLanguageServer(
	connection,
	basePlugin,
	vuePlugin,
);

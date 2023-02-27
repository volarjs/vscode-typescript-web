import * as createTsPlugin from '@volar-plugins/typescript';
import * as createCssPlugin from '@volar-plugins/css';
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

/**
 * Angular plugin
 */

import * as angular from '@volar-examples/angular-language-server';

const angularPlugin: LanguageServerPlugin = (options: TypeScriptWebServerOptions): ReturnType<LanguageServerPlugin> => {
	if (!options.supportAngular) {
		return emptyPluginInstance;
	}
	return {
		tsconfigExtraFileExtensions: [{ extension: 'html', isMixedContent: true, scriptKind: 7 }],
		diagnosticDocumentSelector: [{ language: 'html' }],
		extensions: {
			fileRenameOperationFilter: ['html'],
			fileWatcher: ['html'],
		},
		resolveConfig: angular.resolveConfig,
	};
};

/**
 * MDX plugin
 */

import * as mdx from '@mdx-language-tools/language-core';

const mdxPlugin: LanguageServerPlugin = (options: TypeScriptWebServerOptions): ReturnType<LanguageServerPlugin> => {
	if (!options.supportMdx) {
		return emptyPluginInstance;
	}
	return {
		tsconfigExtraFileExtensions: [{ extension: 'mdx', isMixedContent: true, scriptKind: 7 }],
		diagnosticDocumentSelector: [{ language: 'mdx' }],
		extensions: {
			fileRenameOperationFilter: ['mdx'],
			fileWatcher: ['mdx'],
		},
		resolveConfig(config) {
			config.plugins ??= {}
			config.plugins.typescript ??= createTsPlugin()
			config.plugins.css ??= createCssPlugin()

			config.languages ??= {};
			config.languages.mdx ??= mdx.MdxLanguageModule;
		},
	};
};

startLanguageServer(
	connection,
	basePlugin,
	vuePlugin,
	sveltePlugin,
	angularPlugin,
	mdxPlugin,
);

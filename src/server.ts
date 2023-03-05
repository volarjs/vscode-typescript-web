import createTsPlugin from '@volar-plugins/typescript';
import createCssPlugin from '@volar-plugins/css';
import { createConnection, startLanguageServer, LanguageServerPlugin } from '@volar/language-server/browser';
import { TypeScriptWebServerOptions } from './types';

const connection = createConnection();
const emptyPluginInstance: ReturnType<LanguageServerPlugin> = {
	extraFileExtensions: [],
	watchFileExtensions: [],
};

/**
 * Base TypeScript plugin
 */

const basePlugin: LanguageServerPlugin = (): ReturnType<LanguageServerPlugin> => {
	return {
		extraFileExtensions: [],
		watchFileExtensions: ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'jsx', 'tsx', 'json'],
		resolveConfig(config) {
			config.plugins ??= {};
			config.plugins.typescript ??= createTsPlugin();
			return config;
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
		extraFileExtensions: [{ extension: 'vue', isMixedContent: true, scriptKind: 7 }],
		watchFileExtensions: ['vue'],
		resolveConfig(config, modules, ctx) {

			const ts = modules.typescript;
			if (!ts || !options.supportVue) {
				return config;
			}

			let vueOptions: Partial<vue.VueCompilerOptions> = {};
			if (typeof ctx?.project.tsConfig === 'string') {
				vueOptions = vueCore.createParsedCommandLine(ts, ctx.sys, ctx.project.tsConfig, []).vueOptions;
			}

			return vue.resolveConfig(
				config,
				ts,
				ctx?.host.getCompilationSettings() ?? {},
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
		extraFileExtensions: [{ extension: 'svelte', isMixedContent: true, scriptKind: 7 }],
		watchFileExtensions: ['svelte'],
		resolveConfig(config) {
			config.languages ??= {};
			config.languages.svelte ??= svelte.languageModule;
			return config;
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
		extraFileExtensions: [{ extension: 'html', isMixedContent: true, scriptKind: 7 }],
		watchFileExtensions: ['html'],
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
		extraFileExtensions: [{ extension: 'mdx', isMixedContent: true, scriptKind: 7 }],
		watchFileExtensions: ['mdx'],
		resolveConfig(config) {
			config.plugins ??= {}
			config.plugins.typescript ??= createTsPlugin()
			config.plugins.css ??= createCssPlugin()

			config.languages ??= {};
			config.languages.mdx ??= mdx.MdxLanguageModule;

			return config;
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

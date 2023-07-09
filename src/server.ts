import createTsService from 'volar-service-typescript';
import * as cdn from '@volar/cdn';
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

const basePlugin: LanguageServerPlugin = (options: TypeScriptWebServerOptions, modules): ReturnType<LanguageServerPlugin> => {

	const jsDelivrUriResolver = cdn.createJsDelivrUriResolver('/node_modules', options.versions);
	const jsDelivrFs = cdn.createJsDelivrFs();

	return {
		extraFileExtensions: [],
		watchFileExtensions: ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'jsx', 'tsx', 'json'],
		resolveConfig(config, ctx) {

			if (ctx) {
				cdn.decorateServiceEnvironment(ctx.env, jsDelivrUriResolver, jsDelivrFs);
			}

			if (options.globalModules) {
				config.languages ??= {};
				config.languages.globalEnv = {
					createVirtualFile() {
						return undefined;
					},
					updateVirtualFile() { },
					resolveHost(host) {
						const text = (options.globalModules ?? []).map(name => `/// <reference types="${name}" />`).join('\n');
						const snapshot = modules.typescript!.ScriptSnapshot.fromString(text);
						return {
							...host,
							getScriptFileNames() {
								return [
									...host.getScriptFileNames(),
									'/global.d.ts',
								];
							},
							getScriptSnapshot(fileName) {
								if (fileName === '/global.d.ts') {
									return snapshot;
								}
								return host.getScriptSnapshot(fileName);
							}
						};
					},
				}
			}

			config.services ??= {};
			config.services.typescript = createTsService();

			return config;
		},
	}
};

/**
 * Vue plugin
 */

import * as vue from '@vue/language-server/out/languageServerPlugin';

const vuePlugin: LanguageServerPlugin = (options: TypeScriptWebServerOptions, modules): ReturnType<LanguageServerPlugin> => {
	if (!options.supportVue) {
		return emptyPluginInstance;
	}
	return vue.createServerPlugin(connection)(options, modules);
};

/**
 * Astro plugin
 */

// import * as astro from '@astrojs/language-server/dist/languageServerPlugin';

// const astroPlugin: LanguageServerPlugin = (options: TypeScriptWebServerOptions, modules): ReturnType<LanguageServerPlugin> => {
// 	if (!options.supportAstro) {
// 		return emptyPluginInstance;
// 	}
// 	return astro.plugin(options, modules)
// };

startLanguageServer(
	connection,
	basePlugin,
	vuePlugin,
	// astroPlugin,
);

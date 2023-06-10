import createTsService from 'volar-service-typescript';
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
			config.services ??= {};
			config.services.typescript ??= createTsService();
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

import * as createTsPlugin from '@volar-plugins/typescript';
import { createConnection, startLanguageServer, LanguageServerPlugin } from '@volar/language-server/browser';

const connection = createConnection();

const plugin: LanguageServerPlugin = (): ReturnType<LanguageServerPlugin> => {
	return {
		tsconfigExtraFileExtensions: [],
		diagnosticDocumentSelector: [
			{ language: 'javascript' },
			{ language: 'typescript' },
			{ language: 'javascriptreact' },
			{ language: 'typescriptreact' },
		],
		extensions: {
			fileRenameOperationFilter: ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'jsx', 'tsx', 'json'],
			fileWatcher: ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'jsx', 'tsx', 'json'],
		},
		resolveConfig(config) {
			config.plugins ??= {};
			config.plugins.typescript ??= createTsPlugin();
		},
	}
};

startLanguageServer(connection, plugin);

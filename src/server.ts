import { create as createTypeScriptServicePlugin } from 'volar-service-typescript';
import { LanguagePlugin, createConnection, createServer, createTypeScriptProjectProviderFactory, loadTsdkByUrl } from '@volar/language-server/browser';
import { TypeScriptWebServerOptions } from './types';

// TODO: wait for vue language tools v2
// TODO: @volar/cdn is removed

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize(async params => {

	const initOptiosn: TypeScriptWebServerOptions = params.initializationOptions;
	const tsdk = await loadTsdkByUrl(initOptiosn.typescript.tsdkUrl, params.locale);

	return server.initialize(
		params,
		createTypeScriptProjectProviderFactory(tsdk.typescript, tsdk.diagnosticMessages),
		{
			watchFileExtensions: ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'jsx', 'tsx', 'json'],
			getServicePlugins() {
				return [
					createTypeScriptServicePlugin(tsdk.typescript),
				];
			},
			getLanguagePlugins() {
				if (!initOptiosn.globalModules) {
					return [];
				}
				const globalEnvLanguagePlugin: LanguagePlugin = {
					createVirtualCode() {
						return undefined;
					},
					updateVirtualCode(_fileId, code) {
						return code;
					},
					typescript: {
						extraFileExtensions: [],
						getScript() {
							return undefined;
						},
						resolveLanguageServiceHost(host) {
							const text = (initOptiosn.globalModules ?? []).map(name => `/// <reference types="${name}" />`).join('\n');
							const snapshot = tsdk.typescript.ScriptSnapshot.fromString(text);
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
					},
				};
				return [globalEnvLanguagePlugin];
			},
		},
	)
});

connection.onInitialized(server.initialized);

connection.onShutdown(server.shutdown);

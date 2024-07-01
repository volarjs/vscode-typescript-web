import { createNpmFileSystem } from '@volar/jsdelivr';
import { createConnection, createServer, createTypeScriptProject, Disposable, LanguagePlugin, LanguageServicePlugin, loadTsdkByUrl } from '@volar/language-server/browser';
import { createParsedCommandLine, createVueLanguagePlugin, FileMap, getFullLanguageServicePlugins, resolveVueCompilerOptions, VueCompilerOptions } from '@vue/language-service';
import type * as ts from 'typescript';
import { create as createTypeScriptServicePlugins } from 'volar-service-typescript';
import type { URI } from 'vscode-uri';
import type { TypeScriptWebServerOptions } from './types';

const connection = createConnection();
const server = createServer(connection);

connection.onInitialize(async params => {
	const { globalModules, supportVue, typescript }: TypeScriptWebServerOptions = params.initializationOptions;
	const tsdk = await loadTsdkByUrl(typescript.tsdkUrl, params.locale);
	const ataSys = createNpmFileSystem();
	const languageServicePlugins: LanguageServicePlugin[] = [];
	const watchingExtensions = new Set<string>();

	let fileWatcher: Promise<Disposable> | undefined;

	if (supportVue) {
		// Already includes TS support
		// @ts-expect-error
		languageServicePlugins.push(...getFullLanguageServicePlugins(tsdk.typescript));
	}
	else {
		// @ts-expect-error
		languageServicePlugins.push(...createTypeScriptServicePlugins(tsdk.typescript));
	}

	return server.initialize(
		params,
		createTypeScriptProject(
			tsdk.typescript,
			tsdk.diagnosticMessages,
			async ({ env, asFileName, projectHost, sys, configFileName }) => {
				const { fs } = env;
				env.fs = {
					async stat(uri) {
						return await ataSys.stat(uri) ?? await env.fs?.stat(uri);
					},
					async readDirectory(uri) {
						return [
							...await ataSys.readDirectory(uri),
							... await env.fs?.readDirectory(uri) ?? [],
						];
					},
					async readFile(uri) {
						return await ataSys.readFile(uri) ?? await env.fs?.readFile(uri);
					},
				}
				const plugins: LanguagePlugin<URI>[] = [];
				const watchExtensions = ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'jsx', 'tsx', 'json'];
				if (globalModules) {
					plugins.push(createGlobalEnvPlugin(globalModules));
				}
				let compilerOptions: ts.CompilerOptions | undefined;
				let vueCompilerOptions: VueCompilerOptions | undefined;
				if (supportVue) {
					if (configFileName) {
						let commandLine = createParsedCommandLine(tsdk.typescript, sys, configFileName);
						let sysVersion = sys.version;
						let newSysVersion = await sys.sync();
						while (sysVersion !== newSysVersion) {
							commandLine = createParsedCommandLine(tsdk.typescript, sys, configFileName);
							sysVersion = newSysVersion;
							newSysVersion = await sys.sync();
						}
						compilerOptions = commandLine.options;
						vueCompilerOptions = commandLine.vueOptions;
					}
					else {
						compilerOptions = tsdk.typescript.getDefaultCompilerOptions();
						vueCompilerOptions = resolveVueCompilerOptions({});
					}
					plugins.push(
						createVueLanguagePlugin(
							tsdk.typescript,
							asFileName,
							() => projectHost.getProjectVersion?.() ?? '',
							fileName => {
								const fileMap = new FileMap(sys.useCaseSensitiveFileNames ?? false);
								for (const vueFileName of projectHost?.getScriptFileNames() ?? []) {
									fileMap.set(vueFileName, undefined);
								}
								return fileMap.has(fileName);
							},
							compilerOptions,
							vueCompilerOptions
						)
					);
					watchExtensions.push(
						...vueCompilerOptions.extensions.map(ext => ext.slice(1)),
						...vueCompilerOptions.vitePressExtensions.map(ext => ext.slice(1)),
						...vueCompilerOptions.petiteVueExtensions.map(ext => ext.slice(1)),
					);
				}
				updateFileWatcher(watchExtensions);
				return {
					languagePlugins: plugins,
					setup({ project }) {
						if (vueCompilerOptions) {
							// @ts-expect-error pnpm issue
							project.vue = { compilerOptions: vueCompilerOptions }
						}
					},
				};
			}
		),
		languageServicePlugins
	);

	function updateFileWatcher(extensions: string[]) {
		const newExtensions = extensions.filter(ext => !watchingExtensions.has(ext));
		if (newExtensions.length) {
			for (const ext of newExtensions) {
				watchingExtensions.add(ext);
			}
			fileWatcher?.then(dispose => dispose.dispose());
			fileWatcher = server.watchFiles(['**/*.{' + [...watchingExtensions].join(',') + '}']);
		}
	}
});

connection.onInitialized(server.initialized);

connection.onShutdown(server.shutdown);

connection.listen();

function createGlobalEnvPlugin(globalModules: string[]): LanguagePlugin<URI> {
	return {
		getLanguageId() {
			return undefined;
		},
		typescript: {
			extraFileExtensions: [],
			getServiceScript() {
				return undefined;
			},
			resolveLanguageServiceHost(host) {
				const text = globalModules.map(name => `/// <reference types="${name}" />`).join('\n');
				const snapshot: ts.IScriptSnapshot = {
					getText(start, end) {
						return text.substring(start, end);
					},
					getLength() {
						return text.length;
					},
					getChangeRange() {
						return undefined;
					},
				};
				return {
					...host,
					getScriptFileNames() {
						return [
							...host.getScriptFileNames(),
							'/__virtual_global.d.ts',
						];
					},
					getScriptSnapshot(fileName) {
						if (fileName === '/__virtual_global.d.ts') {
							return snapshot;
						}
						return host.getScriptSnapshot(fileName);
					}
				};
			},
		},
	};
}

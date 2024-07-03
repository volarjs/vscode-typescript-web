import { createNpmFileSystem } from '@volar/jsdelivr';
import { createConnection, createServer, createTypeScriptProject, Disposable, LanguagePlugin, loadTsdkByUrl } from '@volar/language-server/browser';
import { createParsedCommandLine, createVueLanguagePlugin, FileMap, getFullLanguageServicePlugins, resolveVueCompilerOptions, VueCompilerOptions } from '@vue/language-service';
import type * as ts from 'typescript';
import { create as createTypeScriptServicePlugins } from 'volar-service-typescript';
import { URI } from 'vscode-uri';
import type { TypeScriptWebServerOptions } from './types';

const connection = createConnection();
const server = createServer(connection);
const ataSys = createNpmFileSystem(getCdnPath);

function getCdnPath(uri: URI) {
	if (uri.scheme === 'vscode-typescript-web' && uri.authority === 'cdn' && uri.path.startsWith('/')) {
		return uri.path.slice('/'.length);
	}
}

connection.onInitialize(async params => {
	const { globalModules, supportVue, typescript }: TypeScriptWebServerOptions = params.initializationOptions;
	const tsdk = await loadTsdkByUrl(typescript.tsdkUrl, params.locale);
	const languageServicePlugins = createTypeScriptServicePlugins(tsdk.typescript);
	const watchingExtensions = new Set<string>();

	let fileWatcher: Promise<Disposable> | undefined;

	if (supportVue) {
		for (const plugin of getFullLanguageServicePlugins(tsdk.typescript)) {
			if (!languageServicePlugins.some(lsPlugin => lsPlugin.name === plugin.name)) {
				languageServicePlugins.push(plugin);
			}
		}
	}

	return server.initialize(
		params,
		createTypeScriptProject(
			tsdk.typescript,
			tsdk.diagnosticMessages,
			async ({ env, uriConverter, projectHost, sys, configFileName }) => {
				const { asFileName, asUri } = uriConverter;
				const workspaceFolders = [...server.workspaceFolders.keys()];
				uriConverter.asUri = (fileName) => {
					if (fileName === '/node_modules') {
						return URI.parse('vscode-typescript-web://cdn/');
					}
					if (fileName.startsWith('/node_modules/')) {
						return URI.parse('vscode-typescript-web://cdn/' + fileName.slice('/node_modules/'.length));
					}
					if (workspaceFolders.length === 1 && fileName.startsWith('/')) {
						const basePath = workspaceFolders[0].path.endsWith('/')
							? workspaceFolders[0].path
							: workspaceFolders[0].path + '/';
						return URI.from({
							...workspaceFolders[0],
							path: basePath.slice(0, -1) + fileName,
						});
					}
					return asUri(fileName);
				};
				uriConverter.asFileName = (uri) => {
					const cdnPath = getCdnPath(uri);
					if (cdnPath !== undefined) {
						return '/node_modules/' + cdnPath;
					}
					if (workspaceFolders.length === 1) {
						const basePath = workspaceFolders[0].path.endsWith('/')
							? workspaceFolders[0].path
							: workspaceFolders[0].path + '/';
						if (
							uri.scheme === workspaceFolders[0].scheme
							&& uri.authority === workspaceFolders[0].authority
							&& uri.path.startsWith(basePath)
						) {
							return uri.path.slice(basePath.length - 1);
						}
					}
					return asFileName(uri);
				};
				const { fs } = env;
				env.fs = {
					stat(uri) {
						if (getCdnPath(uri) !== undefined) {
							return ataSys.stat(uri);
						}
						if (uri.path.endsWith('/node_modules') || uri.path.includes('/node_modules/')) {
							return;
						}
						return fs?.stat(uri);
					},
					readDirectory(uri) {
						if (getCdnPath(uri) !== undefined) {
							return ataSys.readDirectory(uri);
						}
						if (uri.path.endsWith('/node_modules') || uri.path.includes('/node_modules/')) {
							return [];
						}
						return fs?.readDirectory(uri) ?? []
					},
					readFile(uri) {
						if (getCdnPath(uri) !== undefined) {
							return ataSys.readFile(uri);
						}
						if (uri.path.endsWith('/node_modules') || uri.path.includes('/node_modules/')) {
							return;
						}
						return fs?.readFile(uri);
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
							s => uriConverter.asFileName(s),
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

connection.onRequest('$/cdnFileContent', async (uri: string) => {
	return ataSys.readFile(URI.parse(uri));
});

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

require('esbuild').build({
	entryPoints: {
		client: './out/client.js',
	},
	bundle: true,
	outdir: './dist',
	external: ['vscode'],
	format: 'cjs',
	tsconfig: './tsconfig.json',
	minify: process.argv.includes('--minify'),
	watch: process.argv.includes('--watch'),
	plugins: [
		{
			name: 'node-deps',
			setup(build) {
				build.onResolve({ filter: /^\@vue\/.*$/ }, args => {
					const pathUmdMay = require.resolve(args.path, { paths: [args.resolveDir] })
					const pathEsm = pathUmdMay.replace('.cjs.', '.esm-browser.')
					return { path: pathEsm }
				})
				build.onResolve({ filter: /^path$/ }, args => {
					const path = require.resolve('../node_modules/path-browserify', { paths: [__dirname] })
					return { path: path }
				})
			},
		},
	],
}).catch(() => process.exit(1))

require('esbuild').build({
	entryPoints: {
		server: './out/server.js'
	},
	bundle: true,
	outdir: './dist',
	external: ['fs'],
	format: 'iife',
	tsconfig: './tsconfig.json',
	inject: ['./scripts/process-shim.js'],
	minify: process.argv.includes('--minify'),
	watch: process.argv.includes('--watch'),
	plugins: [
		{
			name: 'node-deps',
			setup(build) {
				build.onResolve({ filter: /^vscode-.*-languageservice$/ }, args => {
					const pathUmdMay = require.resolve(args.path, { paths: [args.resolveDir] })
					const pathEsm = pathUmdMay.replace('/umd/', '/esm/')
					return { path: pathEsm }
				})
				build.onResolve({ filter: /^path$/ }, args => {
					const path = require.resolve('../node_modules/path-browserify', { paths: [__dirname] })
					return { path: path }
				})
				build.onResolve({ filter: /^punycode$/ }, args => {
					const path = require.resolve('../node_modules/punycode', { paths: [__dirname] })
					return { path: path }
				})
			},
		},
	],
}).catch(() => process.exit(1))

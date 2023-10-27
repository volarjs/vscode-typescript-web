Promise.all([
	require('esbuild').context({
		entryPoints: {
			client: './src/client.ts',
		},
		sourcemap: true,
		bundle: true,
		outdir: './dist',
		external: ['vscode'],
		format: 'cjs',
		tsconfig: './tsconfig.json',
		minify: process.argv.includes('--minify'),
		plugins: [
			{
				name: 'node-deps',
				setup(build) {
					build.onResolve({ filter: /^path$/ }, args => {
						const path = require.resolve('../node_modules/path-browserify', { paths: [__dirname] })
						return { path: path }
					})
				},
			},
		],
	}),
	require('esbuild').context({
		entryPoints: {
			server: './src/server.ts',
		},
		sourcemap: true,
		bundle: true,
		outdir: './dist',
		external: ['fs'],
		format: 'iife',
		tsconfig: './tsconfig.json',
		minify: process.argv.includes('--minify'),
		plugins: [
			{
				name: 'node-deps',
				setup(build) {
					build.onResolve({ filter: /^(vscode-.*-languageservice|jsonc-parser)/ }, args => {
						const pathUmdMay = require.resolve(args.path, { paths: [args.resolveDir] });
						// Call twice the replace is to solve the problem of the path in Windows
						const pathEsm = pathUmdMay.replace('/umd/', '/esm/').replace('\\umd\\', '\\esm\\');
						return { path: pathEsm };
					});
					build.onResolve({ filter: /^path$/ }, args => {
						const path = require.resolve('../node_modules/path-browserify', { paths: [__dirname] })
						return { path: path }
					})
				},
			},
		],
	}),
]).then(ctxs => {
	console.log('building...');
	if (process.argv.includes('--watch')) {
		Promise.all(ctxs.map(ctx => ctx.watch()));
		console.log('watching...');
	} else {
		Promise.all(ctxs.map(ctx => ctx.rebuild()));
		Promise.all(ctxs.map(ctx => ctx.dispose()));
		console.log('finished.');
	}
});

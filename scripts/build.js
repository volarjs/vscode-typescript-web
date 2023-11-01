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
	}),
	require('esbuild').context({
		entryPoints: {
			server: './src/server.ts',
		},
		sourcemap: true,
		bundle: true,
		outdir: './dist',
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
				},
			},
		],
	}),
]).then(async ctxs => {
	console.log('building...');
	if (process.argv.includes('--watch')) {
		await Promise.all(ctxs.map(ctx => ctx.watch()));
		console.log('watching...');
	} else {
		await Promise.all(ctxs.map(ctx => ctx.rebuild()));
		await Promise.all(ctxs.map(ctx => ctx.dispose()));
		console.log('finished.');
	}
});

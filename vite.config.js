import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	define: {
		global: 'window'
	},
	resolve: {
		alias: {
			'node-fetch': 'isomorphic-fetch'
		}
	}
};

export default config;

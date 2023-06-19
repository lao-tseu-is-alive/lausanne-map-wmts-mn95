import {defineConfig} from 'vite';

export default defineConfig(({command, mode}) => ({
		// config options
		build: {
				target: 'esnext',
				minify: mode === 'development' ? false : 'terser',
				terserOptions: {
						compress: {
								drop_console: true,
						},
						format: {
								comments: true,
						}
				},
		}
}));

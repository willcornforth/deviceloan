import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/**',
				'dist/**',
				'**/*.test.ts',
				'**/*.spec.ts',
				'src/functions/**', // Azure Functions HTTP handlers
			],
		},
		include: ['src/__tests__/**/*.{test,spec}.ts'],
		exclude: ['node_modules', 'dist'],
		setupFiles: ['./src/__tests__/setup.ts'],
	},
});

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	define: { 'import.meta.env.BASE_PATH': JSON.stringify(process.env.BASE_PATH ?? '') }
});

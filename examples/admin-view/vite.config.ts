import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import Icons from 'unplugin-icons/vite';

const reactDemoFonts = fileURLToPath(new URL('../react-demo/public/fonts', import.meta.url));

export default defineConfig({
	server: {
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd()), reactDemoFonts]
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		}),
		// Settings renders these capabilities with @iconify-json/mdi glyphs; this
		// keeps admin-view on the same set rather than lucide lookalikes.
		Icons({ compiler: 'svelte' })
	]
});

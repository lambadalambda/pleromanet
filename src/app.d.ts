// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
interface ImportMetaEnv {
	readonly BASE_PATH: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

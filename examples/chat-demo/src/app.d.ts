// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Textql } from '@textql/sdk';
import type { StreamingClient } from '@textql/sdk/streaming';

declare global {
	namespace App {
		interface Locals {
			/** SDK clients bound to this visitor's API key. Absent when signed out. */
			textql?: { client: Textql; streaming: StreamingClient };
			signedIn: boolean;
			/** On-prem host this session targets, or null for the default cloud server. */
			serverURL: string | null;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

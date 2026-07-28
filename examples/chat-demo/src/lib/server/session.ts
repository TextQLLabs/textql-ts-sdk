import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

import type { Cookies } from '@sveltejs/kit';

/**
 * A session here is a sealed cookie, not a database row.
 *
 * This app is a *client* of the public TextQL API — it keeps no user table, and
 * the visitor's own API key is the only credential in play. Storing that key
 * server-side would make the demo a custodian of other people's TextQL access,
 * so instead it is encrypted with AES-GCM under a deployment secret and handed
 * back as an httpOnly cookie: it lives only in the visitor's browser (opaque to
 * it) and in the memory of the request that decrypts it.
 *
 * Rotating SESSION_SECRET therefore signs everyone out — unsealing fails and is
 * treated as "no session" rather than an error.
 */

const COOKIE_NAME = 'tql_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const IV_BYTES = 12;

export type Session = {
	apiKey: string;
	/** On-prem hosts only; undefined means the SDK's default cloud server. */
	serverURL?: string;
};

function b64urlEncode(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(value: string): Uint8Array {
	const padded = value.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/**
 * SHA-256 the configured secret so any sufficiently random string works as
 * SESSION_SECRET without callers having to produce exactly 32 raw bytes.
 */
async function sealingKey(): Promise<CryptoKey> {
	const secret = env.SESSION_SECRET;
	if (!secret || secret.length < 32) {
		throw new Error('SESSION_SECRET is missing or shorter than 32 characters.');
	}
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
	return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, [
		'encrypt',
		'decrypt'
	]);
}

async function seal(session: Session): Promise<string> {
	const key = await sealingKey();
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const plaintext = new TextEncoder().encode(JSON.stringify(session));
	const ciphertext = new Uint8Array(
		await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
	);

	const sealed = new Uint8Array(iv.length + ciphertext.length);
	sealed.set(iv);
	sealed.set(ciphertext, iv.length);
	return b64urlEncode(sealed);
}

async function unseal(value: string): Promise<Session | null> {
	try {
		const sealed = b64urlDecode(value);
		if (sealed.length <= IV_BYTES) return null;

		const key = await sealingKey();
		// Copy out rather than pass views: `subarray` keeps the parent's
		// ArrayBufferLike, which doesn't satisfy `BufferSource`.
		const plaintext = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: new Uint8Array(sealed.subarray(0, IV_BYTES)) },
			key,
			new Uint8Array(sealed.subarray(IV_BYTES))
		);

		const parsed: unknown = JSON.parse(new TextDecoder().decode(plaintext));
		if (typeof parsed !== 'object' || parsed === null) return null;

		const { apiKey, serverURL } = parsed as Record<string, unknown>;
		if (typeof apiKey !== 'string' || !apiKey) return null;

		return {
			apiKey,
			serverURL: typeof serverURL === 'string' && serverURL ? serverURL : undefined
		};
	} catch {
		// Tampered, truncated, or sealed under a rotated secret — all mean "signed out".
		return null;
	}
}

export async function readSession(cookies: Cookies): Promise<Session | null> {
	const raw = cookies.get(COOKIE_NAME);
	return raw ? unseal(raw) : null;
}

export async function startSession(cookies: Cookies, session: Session): Promise<void> {
	cookies.set(COOKIE_NAME, await seal(session), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: MAX_AGE_SECONDS
	});
}

export function endSession(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

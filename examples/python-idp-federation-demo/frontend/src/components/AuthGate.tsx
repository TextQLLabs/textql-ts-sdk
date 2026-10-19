import { LogOut } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { usePageTitle } from '../lib/usePageTitle';
import { Button } from '../primitives';

/**
 * Two steps in front of the chat: sign in with the identity provider, then the
 * backend exchanges its ID token for a TextQL access token. There is no TextQL sign-in or
 * approval screen; once the exchange succeeds the chat UI renders unchanged and
 * every /v3/textql call runs as the user's TextQL member.
 */

type Me = {
	email: string | null;
	name: string | null;
	idp: { name: string; issuer: string; id_token_expires_at: number | null; can_refresh: boolean };
	textql: {
		server_url: string;
		org_id: string;
		connected: boolean;
		access_token_expires_at: number | null;
		last_exchanged_at: number | null;
	};
};

type ExchangeError = { error: string; description?: string | null };

class AuthError extends Error {
	constructor(
		readonly status: number,
		readonly detail: unknown
	) {
		super(typeof detail === 'string' ? detail : ((detail as ExchangeError)?.description ?? String(status)));
	}
}

async function auth(path: string, method: 'GET' | 'POST' = 'GET'): Promise<unknown> {
	const response = await fetch(`/v3/auth${path}`, { method });
	const payload = (await response.json().catch(() => ({}))) as { detail?: unknown };
	if (!response.ok) throw new AuthError(response.status, payload.detail ?? response.statusText);
	return payload;
}

const FOOTER_BTN =
	'flex w-full cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-[9px] py-[7px] text-[13px] text-text-3 transition-[background,color] duration-[120ms] ease-[ease] hover:bg-ink/5 hover:text-ink';

function Shell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-paper px-4 font-sans text-ink">
			<div className="w-full max-w-[380px] rounded-lg border border-line/80 bg-elevate p-6 shadow-[0_8px_30px_-12px_rgba(10,10,10,0.18)]">
				<p className="m-0 mb-4 font-pixel text-[15px] tracking-tight text-ink">Acme Internal Tool</p>
				<h1 className="m-0 text-[15px] font-semibold -tracking-[0.01em]">{title}</h1>
				<p className="mt-1 mb-5 text-[12.5px] leading-[1.45] text-muted">{lead}</p>
				{children}
			</div>
		</div>
	);
}

function ErrorNote({ children }: { children: ReactNode }) {
	return <p className="mt-0 mb-3 rounded-sm bg-fill px-3 py-2 text-[12px] text-danger">{children}</p>;
}

function SignIn({ idpName }: { idpName: string }) {
	usePageTitle('Sign in');
	const error = new URLSearchParams(window.location.search).get('login_error');
	return (
		<Shell
			title="Sign in"
			lead={`Use your company ${idpName} account. TextQL trusts the same sign-in, so there's no separate TextQL one.`}
		>
			{error && <ErrorNote>{idpName} sign-in did not finish: {error}</ErrorNote>}
			<Button className="w-full py-2" onClick={() => window.location.assign('/v3/auth/login')}>
				Sign in with {idpName}
			</Button>
		</Shell>
	);
}

function Exchange({ me, onDone, onSignOut }: { me: Me; onDone: () => void; onSignOut: () => void }) {
	usePageTitle('Connecting to TextQL');
	const [error, setError] = useState<ExchangeError | null>(null);
	const [busy, setBusy] = useState(true);
	const started = useRef(false);
	const host = new URL(me.textql.server_url).host;

	const run = useCallback(async () => {
		setBusy(true);
		setError(null);
		try {
			await auth('/textql/exchange', 'POST');
			onDone();
		} catch (err) {
			if (err instanceof AuthError && err.status === 401) return onDone();
			const detail = err instanceof AuthError ? err.detail : null;
			setError(
				typeof detail === 'object' && detail !== null
					? (detail as ExchangeError)
					: { error: 'request_failed', description: (err as Error).message }
			);
		} finally {
			setBusy(false);
		}
	}, [onDone]);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		run();
	}, [run]);

	return (
		<Shell
			title={busy ? 'Connecting to TextQL…' : `TextQL turned down your ${me.idp.name} token`}
			lead={`Signed in as ${me.email ?? me.name ?? 'you'}. This app exchanges your ${me.idp.name} ID token with ${host} for access as your TextQL member.`}
		>
			{error && (
				<ErrorNote>
					{error.description ?? error.error} <span className="text-muted">({error.error})</span>
				</ErrorNote>
			)}
			<div className="flex flex-col gap-2">
				<Button className="py-2" disabled={busy} onClick={run}>
					Try again
				</Button>
				<Button variant="ghost" onClick={onSignOut}>
					Sign out
				</Button>
			</div>
		</Shell>
	);
}

function AccountFooter({ me, onSignOut }: { me: Me; onSignOut: () => void }) {
	const host = new URL(me.textql.server_url).host;
	return (
		<>
			<div className="px-[9px] pb-1.5 text-[11.5px] leading-[1.35] text-muted">
				<span className="text-text-2">{me.email ?? me.name}</span> · TextQL on {host} via {me.idp.name}
			</div>
			<button type="button" className={FOOTER_BTN} onClick={onSignOut}>
				<LogOut size={15} strokeWidth={1.75} />
				<span>Sign out</span>
			</button>
		</>
	);
}

export function AuthGate({ children }: { children: (footer: ReactNode) => ReactNode }) {
	const [me, setMe] = useState<Me | null | undefined>(undefined);
	const [idpName, setIdpName] = useState('SSO');

	useEffect(() => {
		auth('/config')
			.then((c) => setIdpName((c as { idp_name: string }).idp_name))
			.catch(() => {});
	}, []);

	const refresh = useCallback(async () => {
		try {
			setMe((await auth('/me')) as Me);
		} catch {
			setMe(null);
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	// A refused exchange or an IdP session that can't be renewed surfaces as
	// 409/401 from the chat API; re-reading /me drops the user back to the right step.
	useEffect(() => {
		const original = window.fetch;
		window.fetch = async (...args) => {
			const response = await original(...args);
			const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].pathname : args[0].url;
			if (url.includes('/v3/textql') && (response.status === 401 || response.status === 409)) refresh();
			return response;
		};
		return () => {
			window.fetch = original;
		};
	}, [refresh]);

	async function signOut() {
		await auth('/logout', 'POST');
		setMe(null);
	}

	if (me === undefined) return <div className="min-h-screen bg-paper" />;
	if (me === null) return <SignIn idpName={idpName} />;
	if (!me.textql.connected) return <Exchange me={me} onDone={refresh} onSignOut={signOut} />;
	return <>{children(<AccountFooter me={me} onSignOut={signOut} />)}</>;
}

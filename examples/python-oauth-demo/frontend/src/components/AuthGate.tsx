import { LogOut, Unplug } from 'lucide-react';
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react';

import { usePageTitle } from '../lib/usePageTitle';
import { Button } from '../primitives';

/**
 * Two gates in front of the chat: the example app's own sign-in (SQLite users),
 * then a one-time TextQL OAuth connection. Once both pass, the chat UI renders
 * unchanged and every /v3/textql call runs as the user's TextQL member.
 */

type Me = {
	username: string;
	textql: {
		server_url: string;
		connected: boolean;
		access_token_expires_at: number | null;
		last_refreshed_at: number | null;
	};
};

async function auth(path: string, body?: unknown): Promise<unknown> {
	const response = await fetch(`/v3/auth${path}`, {
		method: body === undefined ? 'GET' : 'POST',
		headers: body === undefined ? undefined : { 'content-type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	const payload = (await response.json().catch(() => ({}))) as { detail?: string };
	if (!response.ok) {
		throw Object.assign(new Error(payload.detail ?? response.statusText), { status: response.status });
	}
	return payload;
}

const INPUT =
	'w-full rounded-sm border border-line bg-elevate px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent';

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

function SignIn({ onDone }: { onDone: () => void }) {
	const [mode, setMode] = useState<'login' | 'signup'>('login');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	usePageTitle(mode === 'login' ? 'Sign in' : 'Create account');

	async function submit(e: FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError('');
		try {
			await auth(`/${mode}`, { username, password });
			onDone();
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setBusy(false);
		}
	}

	return (
		<Shell
			title={mode === 'login' ? 'Sign in' : 'Create an account'}
			lead="These are this app's own accounts, stored in SQLite. You connect TextQL next."
		>
			<form method="post" className="flex flex-col gap-2.5" onSubmit={submit}>
				<input
					className={INPUT}
					placeholder="Username"
					autoComplete="username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
				<input
					className={INPUT}
					type="password"
					placeholder="Password"
					autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				{error && <p className="m-0 text-[12px] text-danger">{error}</p>}
				<Button type="submit" className="mt-1 py-2" disabled={busy || !username || !password}>
					{mode === 'login' ? 'Sign in' : 'Create account'}
				</Button>
				<Button variant="ghost" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
					{mode === 'login' ? 'No account? Create one' : 'Have an account? Sign in'}
				</Button>
			</form>
		</Shell>
	);
}

function Connect({ me, onSignOut }: { me: Me; onSignOut: () => void }) {
	usePageTitle('Connect TextQL');
	const error = new URLSearchParams(window.location.search).get('textql_error');
	const host = new URL(me.textql.server_url).host;

	return (
		<Shell
			title={`Connect your TextQL account, ${me.username}`}
			lead={`You'll sign in to ${host} and approve this app once. After that, chats here run as your TextQL member, with exactly the access you already have.`}
		>
			{error && (
				<p className="mt-0 mb-3 rounded-sm bg-fill px-3 py-2 text-[12px] text-danger">
					TextQL sign-in did not finish: {error}
				</p>
			)}
			<div className="flex flex-col gap-2">
				<Button className="py-2" onClick={() => window.location.assign('/v3/auth/textql/connect')}>
					Connect TextQL
				</Button>
				<Button variant="ghost" onClick={onSignOut}>
					Sign out
				</Button>
			</div>
		</Shell>
	);
}

function AccountFooter({ me, onSignOut, onDisconnect }: { me: Me; onSignOut: () => void; onDisconnect: () => void }) {
	const host = new URL(me.textql.server_url).host;
	return (
		<>
			<div className="px-[9px] pb-1.5 text-[11.5px] leading-[1.35] text-muted">
				<span className="text-text-2">{me.username}</span> · TextQL on {host}
			</div>
			<button type="button" className={FOOTER_BTN} onClick={onDisconnect}>
				<Unplug size={15} strokeWidth={1.75} />
				<span>Disconnect TextQL</span>
			</button>
			<button type="button" className={FOOTER_BTN} onClick={onSignOut}>
				<LogOut size={15} strokeWidth={1.75} />
				<span>Sign out</span>
			</button>
		</>
	);
}

export function AuthGate({ children }: { children: (footer: ReactNode) => ReactNode }) {
	const [me, setMe] = useState<Me | null | undefined>(undefined);

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

	// A grant revoked or expired mid-session surfaces as 409/401 from the chat
	// API; re-reading /me drops the user back to the right gate.
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
		await auth('/logout', {});
		setMe(null);
	}

	async function disconnect() {
		await auth('/textql/disconnect', {});
		refresh();
	}

	if (me === undefined) return <div className="min-h-screen bg-paper" />;
	if (me === null) return <SignIn onDone={refresh} />;
	if (!me.textql.connected) return <Connect me={me} onSignOut={signOut} />;
	return <>{children(<AccountFooter me={me} onSignOut={signOut} onDisconnect={disconnect} />)}</>;
}

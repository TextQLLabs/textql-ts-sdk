/**
 * Turns a TextQL token-exchange refusal into something a person can act on.
 *
 * The backend passes TextQL's OAuth `error` code and its `description` through
 * verbatim, so the raw payload is accurate but terse — often the whole message
 * is just "this user cannot sign in by token exchange (invalid_grant)". Here we
 * recognise the sentences TextQL sends for the common misconfigurations, and
 * give each one a plain headline and a hint at what to fix/sign in with.
 *
 * Anything unrecognised still renders: the description becomes the headline and
 * the door is left open for the backend log to carry the rest.
 */

export type ExchangeError = { error: string; description?: string | null };

/** Where the exchange is aimed, used to name the server and IdP in hints. */
export type ErrorContext = { host: string; idpName: string };

export type ExchangeMessage = {
	/** Short headline, e.g. "This account can't use token exchange". */
	title: string;
	/** One sentence on what to do about it. */
	hint: string;
	/** TextQL's own sentence, kept small for support. */
	detail?: string;
	/** Raw OAuth error code (`invalid_grant`, `textql_unavailable`, …). */
	code?: string;
};

type Template = { title: string; hint: (ctx: ErrorContext) => string };

// TextQL's refusals are sentences, not codes, so match the stable fragment.
const BY_DESCRIPTION: Array<{ match: string; template: Template }> = [
	{
		match: 'cannot sign in by token exchange',
		template: {
			title: "This account can't use token exchange",
			hint: () =>
				'TextQL staff accounts are excluded from token exchange. Sign in with a company account instead.',
		},
	},
	{
		match: 'no user has signed in with this identity',
		template: {
			title: 'No TextQL member for this identity',
			hint: ({ host, idpName }) => `Sign in to ${host} through ${idpName} as this user once, then try again.`,
		},
	},
	{
		match: 'user has no active sso sign-in',
		template: {
			title: 'Your TextQL sign-in has lapsed',
			hint: ({ host, idpName }) => `Sign in to ${host} through ${idpName} again, then retry.`,
		},
	},
	{
		match: 'user is not a member of this organization',
		template: {
			title: 'Not a member of this TextQL org',
			hint: () => 'Ask a TextQL admin to invite you, or check the org id this app is configured with.',
		},
	},
	{
		match: 'audience is not accepted',
		template: {
			title: "TextQL doesn't accept this token's audience",
			hint: ({ idpName }) =>
				`Add ${idpName}'s authorization-server audience (e.g. api://default on Okta's default server) to the org's token exchange settings.`,
		},
	},
	{
		match: 'issued to textql, not to your integration',
		template: {
			title: 'The IdP app belongs to TextQL',
			hint: () =>
				"This tool is signing in with TextQL's own OIDC app. Give it a separate app and point IDP_CLIENT_ID at that.",
		},
	},
	{
		match: 'subject_token_type must be an access_token',
		template: {
			title: 'Wrong token type',
			hint: () => 'The app sent an ID token; it has to exchange the IdP access token.',
		},
	},
	{
		match: 'subject_token could not be verified',
		template: {
			title: "TextQL couldn't verify the token",
			hint: () =>
				'Check that token exchange is on for the org, and that IDP_ISSUER matches the provider issuer exactly — a custom server such as /oauth2/default, not the org server.',
		},
	},
];

// Fallbacks for the app's own reason codes, when there's no TextQL sentence.
const BY_CODE: Record<string, Template> = {
	textql_not_connected: {
		title: 'TextQL is not connected yet',
		hint: () => 'Run the exchange again to connect.',
	},
	textql_unavailable: {
		title: 'TextQL is unavailable',
		hint: ({ host }) => `${host} didn't respond. Your sign-in is kept — try again in a moment.`,
	},
	idp_unavailable: {
		title: 'Your identity provider is unavailable',
		hint: ({ idpName }) => `Couldn't refresh your ${idpName} sign-in. Try again in a moment.`,
	},
	request_failed: {
		title: "Couldn't reach the app's backend",
		hint: () => 'The request did not complete. Try again.',
	},
};

export function describeExchangeError(error: ExchangeError, ctx: ErrorContext): ExchangeMessage {
	const description = (error.description ?? '').trim();
	const entry = BY_DESCRIPTION.find(({ match }) => description.toLowerCase().includes(match));
	const template = entry?.template ?? BY_CODE[error.error];
	if (template) {
		return {
			title: template.title,
			hint: template.hint(ctx),
			detail: description || undefined,
			code: error.error,
		};
	}
	return {
		title: description || 'TextQL refused the exchange',
		hint: 'Try again. If it keeps failing, the backend log has the full reason.',
		code: error.error,
	};
}

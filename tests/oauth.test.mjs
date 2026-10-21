import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import {
  ACCESS_TOKEN_TYPE, OAuthRefreshError, TokenManager, authorizationURL, exchangeCode, exchangeToken, fromTokens, tokenManagerOf,
} from '../esm/oauth.js';

const SERVER = 'https://textql-sdk-tests.invalid';

function fakeServer({ validToken = 'access-1', refreshToken = 'refresh-1' } = {}) {
  const state = { validToken, refreshToken, refreshes: 0, api: [] };
  state.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.pathname === '/oauth/token') {
      const form = new URLSearchParams(await request.text());
      if (form.get('refresh_token') !== state.refreshToken) {
        return Response.json({ error: 'invalid_grant' }, { status: 400 });
      }
      state.refreshes += 1;
      state.validToken = `access-${state.refreshes + 1}`;
      state.refreshToken = `refresh-${state.refreshes + 1}`;
      return Response.json({
        access_token: state.validToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: state.refreshToken,
      });
    }
    state.api.push({ headers: request.headers, body: await request.text() });
    if (request.headers.get('authorization') !== `Bearer ${state.validToken}`) {
      return Response.json({ code: 'unauthenticated' }, { status: 401 });
    }
    return Response.json({ chat: { id: 'chat-1' } });
  };
  return state;
}

function client(server, extra = {}) {
  return fromTokens({
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    clientId: 'client',
    clientSecret: 'secret',
    serverURL: SERVER,
    fetch: server.fetch,
    ...extra,
  });
}

test('sends a Bearer token and drops the env API key', async () => {
  process.env.TEXTQL_API_KEY = 'env-key';
  try {
    const server = fakeServer();
    const result = await client(server, { expiresIn: 3600 }).chats.createChat({ body: { message: 'hi' } });

    assert.equal(result.chat.id, 'chat-1');
    assert.equal(server.api[0].headers.get('authorization'), 'Bearer access-1');
    assert.equal(server.api[0].headers.get('tql_api_key'), null);
    assert.equal(server.refreshes, 0);
  } finally {
    delete process.env.TEXTQL_API_KEY;
  }
});

test('refreshes and replays once on a 401', async () => {
  const server = fakeServer({ validToken: 'revoked-elsewhere' });
  const seen = [];
  const result = await client(server, { onTokens: (t) => seen.push(t) })
    .chats.createChat({ body: { message: 'hi' } });

  assert.equal(result.chat.id, 'chat-1');
  assert.deepEqual(server.api.map((r) => r.headers.get('authorization')), ['Bearer access-1', 'Bearer access-2']);
  assert.equal(server.api[1].body, server.api[0].body);
  assert.deepEqual(seen.map((t) => t.refreshToken), ['refresh-2']);
});

test('refreshes before expiry without a 401', async () => {
  const server = fakeServer({ validToken: 'access-2' });
  const textql = client(server, { expiresAt: Date.now() + 30_000 });
  await textql.chats.createChat({ body: { message: 'hi' } });

  assert.deepEqual(server.api.map((r) => r.headers.get('authorization')), ['Bearer access-2']);
  assert.equal(tokenManagerOf(textql).tokens.refreshToken, 'refresh-2');
});

test('concurrent callers share one refresh', async () => {
  const server = fakeServer();
  const manager = new TokenManager({
    accessToken: 'access-1', refreshToken: 'refresh-1', clientId: 'client',
    expiresAt: Date.now(), tokenURL: `${SERVER}/oauth/token`, fetch: server.fetch,
  });

  const tokens = await Promise.all([manager.accessToken(), manager.accessToken(), manager.accessToken()]);

  assert.deepEqual(tokens, ['access-2', 'access-2', 'access-2']);
  assert.equal(server.refreshes, 1);
});

test('a stale token already refreshed by another caller is not refreshed again', async () => {
  const server = fakeServer();
  const manager = new TokenManager({
    accessToken: 'access-1', refreshToken: 'refresh-1', clientId: 'client',
    tokenURL: `${SERVER}/oauth/token`, fetch: server.fetch,
  });

  assert.equal(await manager.accessToken('access-1'), 'access-2');
  assert.equal(await manager.accessToken('access-1'), 'access-2');
  assert.equal(server.refreshes, 1);
});

test('a rejected refresh throws OAuthRefreshError', async () => {
  const server = fakeServer({ refreshToken: 'rotated-elsewhere' });
  const manager = new TokenManager({
    accessToken: 'access-1', refreshToken: 'refresh-1', clientId: 'client',
    expiresAt: Date.now(), tokenURL: `${SERVER}/oauth/token`, fetch: server.fetch,
  });

  await assert.rejects(manager.accessToken(), (err) => {
    assert.ok(err instanceof OAuthRefreshError);
    assert.equal(err.error, 'invalid_grant');
    assert.equal(err.status, 400);
    return true;
  });
});

test('memberId reads the member_id claim of a JWT access token', () => {
  const payload = Buffer.from(JSON.stringify({ member_id: 'member-1' })).toString('base64url');
  const manager = new TokenManager({ accessToken: `e30.${payload}.sig` });

  assert.equal(manager.memberId(), 'member-1');
  assert.equal(new TokenManager({ accessToken: 'opaque' }).memberId(), null);
});

test('a refresh token requires a client id', () => {
  assert.throws(() => new TokenManager({ accessToken: 'a', refreshToken: 'r' }));
});

test('renew lets a manager run without a refresh token', async () => {
  const manager = new TokenManager({ accessToken: 'access-1' });
  assert.equal(manager.canRefresh, false);

  const renewed = new TokenManager({
    accessToken: 'access-1',
    expiresAt: Date.now(),
    renew: () => Promise.resolve({ accessToken: 'access-2', expiresAt: Date.now() + 3_600_000 }),
  });
  assert.equal(renewed.canRefresh, true);
  assert.equal(await renewed.accessToken(), 'access-2');

  let calls = 0;
  const counted = new TokenManager({
    accessToken: 'access-1',
    expiresAt: Date.now(),
    renew: () => {
      calls += 1;
      return { accessToken: `access-${calls + 1}`, expiresAt: Date.now() + 3_600_000 };
    },
  });
  const tokens = await Promise.all([counted.accessToken(), counted.accessToken(), counted.accessToken()]);
  assert.deepEqual(tokens, ['access-2', 'access-2', 'access-2']);
  assert.equal(calls, 1);
});

test('exchangeToken posts the RFC 8693 token exchange grant', async () => {
  let captured;
  const tokens = await exchangeToken({
    subjectToken: 'idp-access-token',
    orgId: 'org-1',
    subjectTokenType: ACCESS_TOKEN_TYPE,
    scopes: ['api:read', 'api:write'],
    serverURL: 'https://tenant.example.com',
    fetch: async (input, init) => {
      captured = { url: String(input), form: Object.fromEntries(new URLSearchParams(String(init.body))) };
      return Response.json({ access_token: 'textql-access', expires_in: 3600 });
    },
  });

  assert.deepEqual(captured, {
    url: 'https://tenant.example.com/oauth/token',
    form: {
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      org_id: 'org-1',
      subject_token: 'idp-access-token',
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      scope: 'api:read api:write',
    },
  });
  assert.equal(tokens.accessToken, 'textql-access');
  assert.equal(tokens.refreshToken, undefined);
});

test('exchangeToken defaults to the id_token subject type and server from env', async () => {
  const previous = process.env.TEXTQL_SERVER_URL;
  process.env.TEXTQL_SERVER_URL = 'https://env.textql.invalid/rpc/public';
  let captured;
  try {
    await exchangeToken({
      subjectToken: 'idp-id-token',
      orgId: 'org-1',
      fetch: async (input, init) => {
        captured = { url: String(input), form: Object.fromEntries(new URLSearchParams(String(init.body))) };
        return Response.json({ access_token: 'textql-access' });
      },
    });
  } finally {
    if (previous === undefined) delete process.env.TEXTQL_SERVER_URL;
    else process.env.TEXTQL_SERVER_URL = previous;
  }

  assert.equal(captured.url, 'https://env.textql.invalid/oauth/token');
  assert.equal(captured.form.subject_token_type, 'urn:ietf:params:oauth:token-type:id_token');
  assert.equal(captured.form.scope, undefined);
});

test('authorizationURL uses S256 PKCE', async () => {
  const req = await authorizationURL({
    clientId: 'client',
    redirectURI: 'https://tool.example.com/callback',
    scopes: ['api:read', 'api:write'],
    serverURL: 'https://tenant.example.com/rpc/public',
  });

  const url = new URL(req.url);
  assert.equal(`${url.origin}${url.pathname}`, 'https://tenant.example.com/oauth/authorize');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('client_id'), 'client');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://tool.example.com/callback');
  assert.equal(url.searchParams.get('scope'), 'api:read api:write');
  assert.equal(url.searchParams.get('state'), req.state);
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(
    url.searchParams.get('code_challenge'),
    createHash('sha256').update(req.codeVerifier).digest('base64url'),
  );
});

test('exchangeCode posts the authorization_code grant', async () => {
  let captured;
  const tokens = await exchangeCode({
    code: 'code-1',
    clientId: 'client',
    clientSecret: 'secret',
    redirectURI: 'https://tool.example.com/callback',
    codeVerifier: 'verifier',
    serverURL: 'https://tenant.example.com',
    fetch: async (input, init) => {
      captured = { url: String(input), form: Object.fromEntries(new URLSearchParams(String(init.body))) };
      return Response.json({ access_token: 'access-1', expires_in: 3600, refresh_token: 'refresh-1' });
    },
  });

  assert.deepEqual(captured, {
    url: 'https://tenant.example.com/oauth/token',
    form: {
      grant_type: 'authorization_code',
      code: 'code-1',
      client_id: 'client',
      client_secret: 'secret',
      redirect_uri: 'https://tool.example.com/callback',
      code_verifier: 'verifier',
    },
  });
  assert.equal(tokens.accessToken, 'access-1');
  assert.equal(tokens.refreshToken, 'refresh-1');
});

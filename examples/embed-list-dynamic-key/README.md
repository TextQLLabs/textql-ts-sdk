# Embed a list of Data Apps, configured from a file

[`embed-list`](../embed-list), except nothing is in the environment. The key and
the app allowlist are read from `secrets.txt` on every request, so changing either
is a file write — no redeploy, no restart.

Two files: [`server.ts`](./server.ts) is the handler and the routes,
[`page.ts`](./page.ts) is the browser half. The whole of the difference from
`embed-list` is that the settings are functions:

```ts
async function required(name: string): Promise<string> {
	const value = (await settings())[name]?.trim();
	if (!value) throw new EmbedError(503, `No ${name}: ${SETTINGS_FILE} does not set it.`);
	return value;
}

const handler = createEmbedHandler({
	client: new Textql({ apiKey: () => required('TEXTQL_API_KEY') }),
	appIds: async () => (await required('TEXTQL_APP_IDS')).split(','),
	basePath: '/api/textql/:appId'
});
```

`Textql` accepts `apiKey` as `() => Promise<string>`, and `createEmbedHandler`
accepts `appIds` the same way. Both are awaited on **every** call, so nothing is
captured at boot and nothing has to be rebuilt when the file changes. There is no
cache: a local read costs microseconds, and caching would only delay the rotation
it exists to serve.

## Run it

```sh
npm run build          # from the repo root; examples link to esm/
cd examples/embed-list-dynamic-key
npm install

cp secrets.txt.example secrets.txt   # then fill it in
npm run dev
```

Open `http://localhost:4182`. `secrets.txt` is in `.gitignore`; the committed
`secrets.txt.example` is a placeholder.

### What goes in `secrets.txt`

Everything, as `name=value` — the same shape as a `.env`:

```sh
# The key from Settings -> Developers -> API Keys.
TEXTQL_API_KEY=NGZhZTNiZDgtOTNhZi00YmYyLThmM2QtM2E5ZmY5NzcyN2E4OmFiY2Rl…
TEXTQL_APP_IDS=7f3c1a2e-…,b91d44c8-…

# Optional
# PORT=4182
# TEXTQL_SERVER_URL=https://textql.your-company.com
```

It is parsed with dotenv's `parse`, so comments, quotes, `export` prefixes and
other names in the same file are all fine. Only `parse` — nothing is loaded into
`process.env`, which is the point.

`TEXTQL_API_KEY` is the string TextQL gives you, `base64("<member_id>:<token>")`,
and it must reach every app in `TEXTQL_APP_IDS`. `PORT` and `TEXTQL_SERVER_URL`
are read once at boot — the SDK takes a base URL, not a resolver — and both are
optional. The rest is re-read per request.

No environment variables at all, and no repo root `.env`: this file is the whole
configuration, which is the entire point.

## Watch it rotate

Leave the server running and edit the file. Nothing else:

Edit `TEXTQL_API_KEY` and refresh — the next request uses the new one. Drop an id
from `TEXTQL_APP_IDS` and it disappears from the grid *and* stops being servable,
because the allowlist is the same function. Empty the key and it is a 503 saying
`does not set it`; delete the file and it is a 503 with the ENOENT.

The pid never changes. A missing or empty key is a 503 with the reason on the
embed routes and on `/healthz`; `GET /` still serves the page, because the
product being up and TextQL being reachable are different questions. That is why
the key is read inside the request rather than at boot — a boot-time read would
turn a missing file into a process that will not start.

## Beyond a file

`readFile` and `parse` are the only things tying `settings()` to a file on disk.
A Kubernetes Secret or Docker secret mounted as a volume *is* this — point
`SETTINGS_FILE` at the mount and the kubelet's sync becomes the rotation, though
note both mount the bare value, so the secret's contents need to be the
`TEXTQL_API_KEY=…` line rather than the key alone.

Vault or AWS Secrets Manager is the same function body with a different call in
it, but over a network you would want a short cache in front of it — which a
local file does not need.

## Everything else

The allowlist and why it is the security model, the list route, `authorize`,
`excludeOwn`, what the app ids are and are not —
[`embed-list`](../embed-list/README.md). The routes themselves and the framework
snippets — [`EMBED.md`](../../EMBED.md).

# Embed a list of Data Apps, with the key read from a file

[`embed-list`](../embed-list), except the API key is never in the environment. It
is read from `secrets.txt` on every request, so rotating it is a file write — no
redeploy, no restart.

Two files: [`server.ts`](./server.ts) is the handler and the routes,
[`page.ts`](./page.ts) is the browser half. The whole of the difference from
`embed-list` is that `apiKey` is a function:

```ts
async function secret(name: string): Promise<string> {
	const value = parse(await readFile(KEY_FILE, 'utf8'))[name]?.trim();
	if (!value) throw new EmbedError(503, `No ${name}: ${KEY_FILE} does not set it.`);
	return value;
}

const handler = createEmbedHandler({
	client: new Textql({ apiKey: () => secret('TEXTQL_API_KEY') }),
	appIds: APP_IDS,
	basePath: '/api/textql/:appId'
});
```

`Textql` accepts `apiKey` as `() => Promise<string>` and awaits it on **every**
call, so nothing is captured at boot and nothing has to be rebuilt when the file
changes. There is no cache: a local read costs microseconds, and caching would
only delay the rotation it exists to serve.

## Run it

```sh
npm run build          # from the repo root; examples link to esm/
cd examples/embed-list-dynamic-key
npm install

cp secrets.txt.example secrets.txt   # then paste your key into it
export TEXTQL_APP_IDS=...            # the apps to list, comma-separated
npm run dev
```

Open `http://localhost:4182`. `secrets.txt` is in `.gitignore`; the committed
`secrets.txt.example` is a placeholder.

### What goes in `secrets.txt`

`name=value`, the same shape as a `.env`:

```sh
# The key from Settings -> Developers -> API Keys.
TEXTQL_API_KEY=NGZhZTNiZDgtOTNhZi00YmYyLThmM2QtM2E5ZmY5NzcyN2E4OmFiY2Rl…
```

It is parsed with dotenv's `parse`, so comments, quotes, `export` prefixes and
other names in the same file are all fine. Only `parse` — nothing is loaded into
`process.env`, which is the point.

Asking for it by name is one line, so a second secret is too:

```ts
const apiKey = () => secret('TEXTQL_API_KEY');
```

The value is the string TextQL gives you, `base64("<member_id>:<token>")`, and it
must be able to reach every app in `TEXTQL_APP_IDS`.

### Other settings

```sh
TEXTQL_APP_IDS=...      # the apps to list; falls back to TEXTQL_APP_ID
TEXTQL_API_KEY_FILE=... # read somewhere else instead of ./secrets.txt
TEXTQL_SERVER_URL=...   # on-prem only; the plain host, the SDK appends /rpc/public
```

Unlike the other examples this one does not read the repo root `.env`. The key
lives in a file it reads itself, which is the entire point.

## Watch it rotate

Leave the server running and edit the file. Nothing else:

```sh
printf 'TEXTQL_API_KEY=%s\n' "$OTHER" > secrets.txt   # refresh: the new key is in use
printf 'TEXTQL_API_KEY=\n' > secrets.txt              # 503 "does not set it"
rm secrets.txt                                        # 503 with the ENOENT
printf 'TEXTQL_API_KEY=%s\n' "$KEY" > secrets.txt     # 200 again
```

The pid never changes. A missing or empty key is a 503 with the reason on the
embed routes and on `/healthz`; `GET /` still serves the page, because the
product being up and TextQL being reachable are different questions. That is why
the key is read inside the request rather than at boot — a boot-time read would
turn a missing file into a process that will not start.

## Beyond a file

`readFile` and `parse` are the only things tying this to a file on disk. A
Kubernetes Secret mounted as a volume *is* this — point `TEXTQL_API_KEY_FILE` at
the mount and the kubelet's sync becomes the rotation. Vault or AWS Secrets Manager is the same function body
with a different call in it, though over a network you would want a short cache
in front of it, which a local file does not need.

## Everything else

The allowlist and why it is the security model, the list route, `authorize`,
`excludeOwn`, what the app ids are and are not —
[`embed-list`](../embed-list/README.md). The routes themselves and the framework
snippets — [`EMBED.md`](../../EMBED.md).

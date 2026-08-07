# Drop-in TextQL embed routes, configured from a file

[`textqlEmbed.js`](./textqlEmbed.js) is the whole thing — one file. Mount it in a
server or a Vite config you already have and it adds the routes `<textql-app>`
calls. The API key and the app allowlist come
from a `name=value` file that is re-read on **every request**, so rotating either is
a file write — no redeploy, no restart, nothing in the environment.

```js
// vite.config.js
import { textqlEmbed } from './textqlEmbed.js';

export default defineConfig({
	plugins: [textqlEmbed({ file: 'secrets.txt', basePath: '/api/textql' })]
});
```

Or anywhere else, with the handler directly:

```js
import { createTextqlEmbed } from './textqlEmbed.js';

const embed = createTextqlEmbed({ file: 'secrets.txt', basePath: '/api/textql' });
```

That gives you four routes under `basePath`:

| | |
| --- | --- |
| `GET /api/textql` | `[{ id, name, screenshotUrl }]` for the allowlisted apps |
| `GET /api/textql/<id>/app` | one app's metadata |
| `GET /api/textql/<id>/document` | the app's HTML, re-served from your origin |
| `POST /api/textql/<id>/compute` | run one of the app's compute functions |

## Mounting it

The return value is a Web `(Request) => Promise<Response | null>` — `null` when the
path is not one of ours, so it composes with your own routing.

The Vite plugin above wraps exactly this, registering it ahead of Vite's own
middleware so the SPA fallback cannot swallow the API.

```js
// node:http and Express, via the attached adapter. Resolves false to fall through.
if (await embed.node(req, res)) return;

app.use(async (req, res, next) => {
	if (!(await embed.node(req, res))) next();
});

// Anything Web-native: Hono, Remix, SvelteKit, Bun, Deno, Workers.
app.all('/api/textql/*', async (c) => (await embed(c.req.raw)) ?? c.notFound());

// Next.js app router.
export const { GET, POST } = embed;
```

The file is only exports — importing it starts nothing, opens no port and reads no
file until a request arrives.

## The file

`name=value`, the same shape as a `.env`:

```sh
# The key from Settings -> Developers -> API Keys.
TEXTQL_API_KEY=NGZhZTNiZDgtOTNhZi00YmYyLThmM2QtM2E5ZmY5NzcyN2E4OmFiY2Rl…
TEXTQL_APP_IDS=7f3c1a2e-…,b91d44c8-…
```

Parsed with dotenv's `parse`, so comments, quotes, `export` prefixes and other
names in the same file are fine. Only `parse` — nothing is loaded into
`process.env`, which is the point. `secrets.txt` is in `.gitignore`; the committed
`secrets.txt.example` is a placeholder.

`TEXTQL_API_KEY` is the string TextQL gives you, `base64("<member_id>:<token>")`,
and it must reach every app in `TEXTQL_APP_IDS`. For an on-prem deployment set
`TEXTQL_SERVER_URL` in the environment — the SDK reads that one itself.

## Why per-request

Both settings are passed to the SDK as **functions**:

```js
new Textql({ apiKey: () => required('TEXTQL_API_KEY') });
createEmbedHandler({ appIds: async () => (await required('TEXTQL_APP_IDS')).split(',') });
```

`Textql` awaits `apiKey` on every call and `createEmbedHandler` awaits `appIds` the
same way, so nothing is captured at construction. Edit the key and the next request
uses it. Drop an id from the list and it vanishes from the grid *and* stops being
servable, because the allowlist is that same function. There is no cache: a local
read costs microseconds, and caching would only delay the rotation it exists to
serve.

The other half of that is failure. A missing or empty setting is an
`EmbedError(503)` naming which one, raised inside the request — so the file being
absent at boot cannot stop your server from starting, and cannot touch the routes
that have nothing to do with TextQL:

```sh
rm secrets.txt        # 503 with the ENOENT; the rest of your app is unaffected
```

## Run it here

```sh
npm run build          # from the repo root; examples link to esm/
cd examples/embed-list-dynamic-key
npm install

cp secrets.txt.example secrets.txt   # then fill it in
npm run dev            # vite, using the vite.config.js in this directory

curl localhost:5173/api/textql
```

There is no `index.html`, so `/` is a 404 — the routes are the point. Add your own
page with `<textql-app>` in it and Vite will serve that too.

## Using it in your project

Copy `textqlEmbed.js` in, add the two dependencies, and keep your key out of git:

```sh
npm install @textql/sdk dotenv
cp secrets.txt.example secrets.txt
echo secrets.txt >> .gitignore
```

Then the plugin line in your own `vite.config.js`, as above.

Plain JavaScript — no build step, no TypeScript, and no Vite dependency either:
the plugin is a plain object, so nothing in the file imports Vite.

`file` is resolved against the process's working directory, which for `vite` is
your project root.

## Beyond a file

`readFile` and `parse` are the only things tying `required()` to disk. A Kubernetes
Secret or Docker secret mounted as a volume *is* this — point `file` at the mount
and the platform's sync becomes the rotation, though note both mount the bare
value, so the secret's contents need to be the `TEXTQL_API_KEY=…` line rather than
the key alone. Vault or Secrets Manager is the same function body with a different
call in it, but over a network you would want a short cache in front of it, which a
local file does not need.

## The browser half

Not here — this is the server side only. The element that calls these routes is
`@textql/sdk/embed/element`; import it in your own frontend and point it at the
mount:

```html
<textql-app api-base="/api/textql/<id>"></textql-app>
```

[`embed-list`](../embed-list) has a working page, the allowlist reasoning, and
`authorize`. [`EMBED.md`](../../EMBED.md) has the rest.

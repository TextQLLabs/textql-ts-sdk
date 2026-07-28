# TextQL Chat Demo (React)

A full chat application built on the TextQL API with [`@textql/sdk`](https://www.npmjs.com/package/@textql/sdk):
create chats, pick a model and data connectors, watch runs stream in live
(thinking, tool calls, answers), preview generated assets — and reload the page
mid-run without losing the stream.

Built with Vite + React + React Router. It is a feature-for-feature port of
[`../svelte-demo`](../svelte-demo) — same API routes, same UI, same
[streaming client](../../STREAMING.md) usage.

## Setup

**1. Get a TextQL API key** — in the TextQL app under
**Settings → Developers → API Keys**, click **+ Create API Key** (admin only).

**2. Install and configure:**

```sh
git clone https://github.com/TextQLLabs/textql-ts-sdk.git
cd textql-ts-sdk/examples/react-demo
npm install
echo 'TEXTQL_API_KEY=your-key-here' > .env
# On-prem only — otherwise omit (defaults to the cloud host):
echo 'TEXTQL_SERVER_URL=https://your-host.example.com' >> .env
```

**3. Run:**

```sh
npm run dev -- --open
```

That's it — the app opens at `http://localhost:5173`. Requires Node 22+
(`sanitize-html` sets that engine floor).

> On-prem deployments: set `TEXTQL_SERVER_URL` in `.env` to your plain host
> (e.g. `https://your-host.example.com`). The SDK appends the `/rpc/public`
> mount itself, for both unary and streaming calls.

## What it demonstrates

| Capability | How |
| --- | --- |
| Create chats with a model + connectors | `client.chats.createChat` with a typed universal paradigm |
| Send messages | `client.chats.send` |
| Live run streaming | `streaming.chats.watchChat` — cells plus `runStarted` / `runComplete` / `runError` lifecycle |
| Re-attach after a page reload | watch with `latestCompleteCellId` as the resume cursor |
| List / open / delete chats, list connectors | unary SDK calls |

## How it's put together

The API key never reaches the browser. SvelteKit gives the Svelte demo server
routes for free; here a small Vite plugin (`server/index.ts`, mounted in
`vite.config.ts`) serves the same `/api/**` surface from the dev and preview
servers, forwarding stream events to the client as NDJSON lines of
protojson-encoded `WatchChatEvent`s (the gRPC type is the wire contract — no
bespoke event protocol).

```md
Browser (src/components/ChatPage.tsx)
  │  fetch + NDJSON
  ▼
Vite middleware API routes (server/routes/**)
  │  @textql/sdk (unary) + @textql/sdk/streaming (Connect-RPC)
  ▼
TextQL API
```

Key files:

- `server/index.ts` — route table + Node↔Web `Request`/`Response` adapter
- `server/textql.ts` — shared per-process SDK clients (unary + streaming)
- `server/routes/chat.ts` — create/send, then stream the run via `watchChat`
- `server/routes/chats.ts` — history, delete, and re-attach to a live run after reload
- `src/lib/streamEvents.ts` — the typed NDJSON wire contract (protojson `WatchChatEvent` + zod envelope)
- `src/components/ChatPage.tsx` — stream consumption, run-state UI, resume
- `src/lib/cells.ts` — cell lifecycle helpers (what's running vs settled)

## Differences from the Svelte demo

Behaviour and styling are the same; only the framework plumbing differs.

| Svelte | React |
| --- | --- |
| SvelteKit `src/routes/api/**/+server.ts` | `server/routes/**` behind a Vite middleware plugin |
| SvelteKit file routing + `$app/state` | `react-router-dom` (`App.tsx`) |
| `$state` classes (`previewPanel`, `themePref`, …) | `Store` + `useSyncExternalStore` (`src/lib/store.ts`) |
| Component-scoped `<style>` | Tailwind utilities (see below) |
| `transition:` directives | `@theme` keyframes + the `Collapse` component (Web Animations) |
| `@lucide/svelte`, `svelte-sonner` | `lucide-react`, `sonner` |

The one place the rendered output intentionally differs is `/style`, which
documents each primitive's signature: the `Page` sample takes `actions` as a
prop rather than a `{#snippet}`, and `Toaster` is imported from
`../primitives`, not `$lib/primitives`.

Two files from the Svelte demo are *not* ported: `assets/icons/Logo.svelte` and
`assets/icons/SpinnerArrows.svelte`. They are unused there and don't compile
(`npm run check` in `../svelte-demo` reports them), because they still
import from the main TextQL app's `$/lib/brand/*`.

## Styling

Svelte's scoped `<style>` blocks became Tailwind utilities rather than CSS
Modules, so the design tokens in `src/app.css`'s `@theme` are the whole system:
colours (`bg-paper`, `text-muted`, `border-line/80`), radii (`rounded-sm` =
10px), fonts, and the entrance animations (`animate-modal-reveal`,
`animate-flyout-in`, …) that replaced `transition:` directives.

Rules worth knowing before editing:

- `color-mix(in srgb, X N%, transparent)` is exactly Tailwind's `/N` opacity
  modifier — `bg-ink/3.5`. Two *named* colours need an arbitrary value:
  `bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-elevate))]`.
- Named text sizes (`text-xs`) also set `line-height`. Where the design sets
  only a font size, use `text-[12px]` so the inherited line-height survives.
- **A shared class constant must not contain a property its callers override.**
  Two utilities touching the same property are resolved by Tailwind's own rule
  order, not the order in your class string — so branch, don't append:
  `cx(BASE, active ? 'text-ink' : 'text-muted')`.
- Class names must be literal. Tailwind scans source text, so
  `` `text-[${colour}]` `` silently generates nothing.
- Element-level defaults live in `@layer base` so utilities can override them.
  Unlayered CSS beats every utility — an unlayered `button { font: inherit }`
  will quietly swallow `text-[12.5px]`.

`Markdown.module.css` is the deliberate exception: it styles
`dangerouslySetInnerHTML` output through descendant selectors, which utilities
cannot reach.

## Scripts

```sh
npm run dev      # dev server with hot reload (API routes included)
npm run check    # tsc --noEmit (types)
npm run build    # production build
npm run preview  # serve the production build (API routes included)
```

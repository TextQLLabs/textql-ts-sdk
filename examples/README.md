# @textql/sdk Examples

Standalone scripts demonstrating the [`@textql/sdk`](https://www.npmjs.com/package/@textql/sdk) SDK.
For a full application (live streaming UI, reload re-attach) see [`chat-demo`](./chat-demo).

## Prerequisites

- Node.js v18 or higher
- A TextQL API key — in the app under **Settings → Developers → API Keys**

## Setup

```bash
cp .env.template .env   # then edit .env and add your TEXTQL_API_KEY
npm install
```

## Examples

| File | What it shows |
| --- | --- |
| `watchChat.ts` | Create a chat and stream its run live (cells + lifecycle) over the Connect-RPC bridge |
| `createAgent.ts` | Create a scheduled agent with a typed universal paradigm, trigger it, list runs, delete |
| `createPlaybook.ts` | Create → configure (schedule, model, Slack/email delivery) → deploy a playbook |

Run any of them with `tsx`:

```bash
npm run build && npx tsx watchChat.ts
npm run build && npx tsx watchChat.ts "What tables are available?"
```

> On-prem/dev: set `TEXTQL_SERVER_URL` in `.env` to your host (e.g.
> `https://your-host.example.com`). The SDK appends the `/rpc/public` mount
> itself — point it at the plain host.

## Creating new examples

Duplicate an existing example file — they won't be overwritten by SDK regeneration.

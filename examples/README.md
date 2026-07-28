# @textql/sdk Examples

Standalone scripts demonstrating the [`@textql/sdk`](https://www.npmjs.com/package/@textql/sdk) SDK.
For a full application (live streaming UI, reload re-attach) see the chat demos —
the same app in two frameworks: [`svelte-demo`](./svelte-demo) (SvelteKit)
and [`react-demo`](./react-demo) (Vite + React).

## Prerequisites

- Node.js (v18 or higher)
- npm

## Setup

1. Copy `.env.template` to `.env`:

   ```bash
   cp .env.template .env
   ```

2. Edit `.env` and add your actual credentials (API keys, tokens, etc.)

## Running the Examples

To run an example file from the examples directory:

```bash
npm run build && npx tsx example.ts
```

## Creating new examples

Duplicate an existing example file, they won't be overwritten by the generation process.

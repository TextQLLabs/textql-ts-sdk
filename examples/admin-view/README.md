# TextQL administration example

A SvelteKit administration experience built against a real TextQL organization.
It uses the exact `@textql/sdk` `1.4.21` pin from `package.json`; it does not ship
fixture members, roles, permissions, keys, features, or audit events.

## Run it

```bash
npm install
cp .env.example .env
npm run dev
```

Set the server-only environment variables in `.env`:

```dotenv
TEXTQL_API_KEY=replace-with-a-current-key
TEXTQL_SERVER_URL=https://app.textql.com
```

The SDK client appends `/rpc/public` to the configured server URL. The API key
is only read from SvelteKit server modules and is never serialized to the page.

## Administration routes

| Route | Purpose |
| --- | --- |
| `/` | Access posture, items to review, connectors, models, and recent audit activity |
| `/people` | People, service accounts, API keys, and role assignment |
| `/roles` | Role metadata, model policy, and permission grants |
| `/models` | Organization model availability and default model policy |
| `/features` | Organization feature availability and defaults |
| `/changes` | Searchable organization audit history |

The older configuration-model examples remain available under **Developer
reference** in the sidebar.

## Organization context

Most RBAC operations and `settings.updateModels` infer the organization from
the API key. The deployed `settings.listMembers` operation requires `orgId`, so
the server data layer derives it from `settings.get` (or the first returned
role as a fallback). It is an internal request detail: the UI never asks the
admin to find or enter an organization ID.

## Svelte primitives

`src/lib/primitives` ports the React demo's complete primitive surface to
Svelte: Button, Confirm, Debug, Layout, Marquee, Modal, Page, Select, Switch,
Text, Toaster, Tooltip, and the imperative `confirm` and `toast` helpers.

The administration pages use the same paper/sidebar palette, local Geist Pixel
and Ioskeley Mono assets, spacing, focus treatment, controls, and compact page
headers as `examples/react-demo`.

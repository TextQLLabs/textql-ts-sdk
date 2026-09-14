# @textql/sdk Examples

This directory contains example scripts demonstrating how to use the @textql/sdk SDK.

## Complete applications

- [`agent-chat-demo`](./agent-chat-demo): the full Python/React chat interface on
  React 19.2.0 and Python 3.12.10 with pip, using `textql-sdk==1.1.24` directly in FastAPI,
  with file/CSV uploads and an agent automatically attached to every new chat.
- [`python-react-demo`](./python-react-demo): the original React application with
  a FastAPI backend using the Python SDK.
- [`react-demo`](./react-demo): the React application with a TypeScript backend.

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

Look at how textql-ts-sdk/examples/embed-list-dynamic-key at main · TextQLLabs/textql-ts-sdk implements the JS Text SDK -  please copy that into here and re write the implementations we have in @embed-textql.js

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmbedHandler } from '../esm/embed.js';

function handler(debug, onError = () => {}) {
  return createEmbedHandler({
    appIds: ['demo'], basePath: '/api/textql/:appId', debug, onError,
    client: { apps: { get: async () => {
      throw new Error('fetch failed', {
        cause: Object.assign(new Error('Connection refused'), { code: 'ECONNREFUSED' }),
      });
    } } },
  });
}

test('debug mode makes list and metadata failures visible to existing consumers', async () => {
  for (const path of ['/api/textql', '/api/textql/demo/app']) {
    const response = await handler(true)(new Request(`http://localhost${path}`));
    assert.equal(response.status, 500);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.json();
    assert.match(body.error, /apps.get failed \(HTTP 500\).*fetch failed.*ECONNREFUSED.*Connection refused/);
    assert.equal(body.diagnostics.appId, 'demo');
    assert.equal(body.diagnostics.path, path);
    assert.equal(body.diagnostics.errors[1].code, 'ECONNREFUSED');
    assert.match(body.diagnostics.errors[0].stack, /embed-debug/);
  }
});

test('default responses remain generic while server logs retain the cause', async () => {
  const logs = [];
  const response = await handler(undefined, (log) => logs.push(log))(
    new Request('http://localhost/api/textql'));
  assert.deepEqual(await response.json(), { error: 'The embed request failed.' });
  assert.equal(logs[0].errors[1].code, 'ECONNREFUSED');
});

test('a custom logger cannot mutate browser diagnostics', async () => {
  const response = await handler(true, (log) => { log.errors[0].message = 'changed'; })(
    new Request('http://localhost/api/textql'));
  assert.equal((await response.json()).diagnostics.errors[0].message, 'fetch failed');
});

test('debug responses redact environment credentials and signed URL queries', async () => {
  const previous = process.env.TEXTQL_API_KEY;
  process.env.TEXTQL_API_KEY = 'test-secret-key';
  try {
    const embed = createEmbedHandler({
      debug: true, appId: 'demo', onError: () => {},
      client: { apps: { get: async () => {
        throw new Error('test-secret-key https://assets.example/app?signature=secret');
      } } },
    });
    const response = await embed(new Request('http://localhost/api/textql/app'));
    const text = await response.text();
    assert.doesNotMatch(text, /test-secret-key|signature=secret/);
    assert.match(text, /\[redacted\]/);
  } finally {
    if (previous === undefined) delete process.env.TEXTQL_API_KEY;
    else process.env.TEXTQL_API_KEY = previous;
  }
});

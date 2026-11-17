import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmbedHandler } from '../esm/embed.js';

function computeRequest(appId = 'demo', name = 'load') {
  return new Request(`http://localhost/api/textql/${appId}/compute`, {
    method: 'POST',
    body: JSON.stringify({ name, params: { limit: 10 } }),
  });
}

test('compute goes straight to the app-scoped invocation without loading source files', async () => {
  const calls = [];
  const embed = createEmbedHandler({
    appIds: ['demo'], basePath: '/api/textql/:appId',
    client: { apps: {
      get: async () => assert.fail('compute must not fetch the app'),
      invokeComputeFunction: async (request) => {
        calls.push(request.body);
        return { resultJson: '{"rows":[1,2,3]}' };
      },
    } },
  });
  const response = await embed(computeRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { result: { rows: [1, 2, 3] } });
  assert.deepEqual(calls, [{
    appId: 'demo', functionName: 'load', paramsJson: '{"limit":10}',
  }]);
});

test('compute rechecks authorization and the current allowlist on every request', async () => {
  let authorized = true;
  let allowed = ['demo'];
  let invocations = 0;
  const embed = createEmbedHandler({
    authorize: async () => authorized,
    appIds: async () => allowed,
    basePath: '/api/textql/:appId', onError: () => {},
    client: { apps: { invokeComputeFunction: async () => {
      invocations++;
      return { resultJson: 'null' };
    } } },
  });
  assert.equal((await embed(computeRequest())).status, 200);
  assert.equal((await embed(computeRequest('another-app'))).status, 404);
  allowed = [];
  assert.equal((await embed(computeRequest())).status, 404);
  allowed = ['demo'];
  authorized = false;
  assert.equal((await embed(computeRequest())).status, 403);
  assert.equal(invocations, 1);
});

test('compute preserves upstream denial of undeclared or inaccessible functions', async () => {
  const embed = createEmbedHandler({
    appId: 'demo', onError: () => {},
    client: { apps: { invokeComputeFunction: async () => {
      throw Object.assign(new Error('not found'), {
        statusCode: 404, body: '{"message":"compute function not found"}',
      });
    } } },
  });
  const response = await embed(new Request('http://localhost/api/textql/compute', {
    method: 'POST', body: JSON.stringify({ name: 'undeclared' }),
  }));
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'compute function not found' });
});

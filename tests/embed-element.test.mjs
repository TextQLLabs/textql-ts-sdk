import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const source = (await readFile(new URL('../esm/embed/element.js', import.meta.url), 'utf8'))
  .replace('export class TextqlAppElement', 'class TextqlAppElement');

class Element extends EventTarget {
  children = [];
  attributes = new Map();
  isConnected = true;
  parent = null;
  attachShadow() { return this.shadowRoot = new Element(); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  append(...children) {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }
  replaceChildren(...children) {
    for (const child of this.children) child.parent = null;
    this.children = [];
    this.append(...children);
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((node) => node !== this);
    this.parent = null;
  }
  replaceWith(node) {
    const parent = this.parent;
    parent.children[parent.children.indexOf(this)] = node;
    node.parent = parent;
    this.parent = null;
  }
}

function setup() {
  let constructor;
  const requests = [];
  const frames = [];
  const window = new EventTarget();
  const context = vm.createContext({
    HTMLElement: Element, CustomEvent, console, window,
    customElements: {
      get: () => undefined,
      define: (_name, value) => { constructor = value; },
    },
    document: {
      createElement(tag) {
        const element = new Element();
        if (tag === 'iframe') {
          element.messages = [];
          element.contentWindow = { postMessage: (message) => element.messages.push(message) };
          frames.push(element);
        }
        return element;
      },
      createTextNode: (text) => Object.assign(new Element(), { textContent: text }),
    },
    fetch: (url) => new Promise((resolve) => requests.push({ url, resolve })),
  });
  vm.runInContext(source, context);
  const element = new constructor();
  const ready = (frame) => {
    const event = new Event('message');
    Object.assign(event, { source: frame.contentWindow, data: { bridge: 'ana/v1', type: 'ready' } });
    window.dispatchEvent(event);
  };
  const meta = async (request = requests.at(-1), name = 'Example') => {
    request.resolve(Response.json({ name, functions: ['load'], screenshotUrl: null }));
    await new Promise((resolve) => setImmediate(resolve));
  };
  return { element, frames, requests, ready, meta };
}

test('document starts before metadata and early ready waits for compute capabilities', async () => {
  const { element, frames, requests, ready, meta } = setup();
  const events = [];
  element.addEventListener('app-ready', (event) => events.push(event.detail));
  element.connectedCallback();
  const frame = frames[0];
  const parent = frame.parent;
  assert.ok(parent, 'iframe is attached while metadata is still pending');
  assert.equal(frame.src, '/api/textql/document');
  assert.equal(requests[0].url, '/api/textql/app');
  ready(frame);
  assert.equal(frame.messages.length, 0, 'do not greet with compute disabled');
  assert.equal(events.length, 0);
  await meta();
  assert.equal(frame.messages[0].capabilities.compute, true);
  assert.equal(events[0].name, 'Example');
  assert.equal(frame.parent, parent, 'metadata must not detach/reload the iframe');
  assert.equal(frames.length, 1);
});

test('metadata first preserves the frame and greets when the document is ready', async () => {
  const { element, frames, ready, meta } = setup();
  element.connectedCallback();
  const frame = frames[0];
  const parent = frame.parent;
  await meta();
  assert.equal(frame.messages.length, 0);
  assert.equal(frame.parent, parent);
  ready(frame);
  assert.equal(frame.messages[0].capabilities.compute, true);
});

test('document load before metadata still completes the fallback handshake', async () => {
  const { element, frames, meta } = setup();
  element.connectedCallback();
  const frame = frames[0];
  frame.dispatchEvent(new Event('load'));
  assert.equal(frame.messages.length, 0);
  await meta();
  assert.equal(frame.messages[0].capabilities.compute, true);
});

test('remount ignores stale metadata and messages from the replaced document', async () => {
  const { element, frames, requests, ready, meta } = setup();
  element.connectedCallback();
  const previous = frames[0];
  const pending = element.load();
  await meta(requests[0], 'Stale');
  assert.equal(element.meta, null);
  ready(previous);
  assert.equal(previous.messages.length, 0);
  ready(frames[1]);
  await meta(requests[1], 'Current');
  await pending;
  assert.equal(element.meta.name, 'Current');
  assert.equal(frames[1].messages[0].capabilities.compute, true);
});

test('metadata failure removes the document and does not greet it', async () => {
  const { element, frames, requests } = setup();
  element.connectedCallback();
  requests[0].resolve(Response.json({ error: 'Denied' }, { status: 403 }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(frames[0].parent, null);
  assert.equal(frames[0].messages.length, 0);
});

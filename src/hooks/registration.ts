import { BeforeRequestContext, BeforeRequestHook, Hooks } from "./types.js";

/*
 * This file is only ever generated once on the first generation and then is free to be modified.
 * Any hooks you wish to add should be registered in the initHooks function. Feel free to define them
 * in this file or in separate files in the hooks folder.
 */

const RPC_PREFIX = "/rpc/public";

class RPCPublicPrefixHook implements BeforeRequestHook {
  beforeRequest(_hookCtx: BeforeRequestContext, request: Request): Request {
    const url = new URL(request.url);
    if (url.pathname.includes(RPC_PREFIX) || !url.pathname.startsWith("/textql.")) {
      return request;
    }
    url.pathname = `${RPC_PREFIX}${url.pathname}`;
    return new Request(url, request);
  }
}

export function initHooks(hooks: Hooks) {
  // Add hooks by calling hooks.register{ClientInit/BeforeCreateRequest/BeforeRequest/AfterSuccess/AfterError}Hook
  // with an instance of a hook that implements that specific Hook interface
  // Hooks are registered per SDK instance, and are valid for the lifetime of the SDK instance
  hooks.registerBeforeRequestHook(new RPCPublicPrefixHook());
}

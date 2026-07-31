/**
 * Environment variables this SDK reads beyond the generated `lib/env.ts`.
 * That schema is fixed to the keys Speakeasy declares (`TEXTQL_API_KEY`,
 * `TEXTQL_DEBUG`) and drops everything else, so these are read directly.
 */

/** Reads from Deno or Node without assuming either global is present. */
export function readEnv(key: string): string | undefined {
  const globals = globalThis as {
    Deno?: { env?: { get?: (key: string) => string | undefined } };
    process?: { env?: Record<string, string | undefined> };
  };
  return globals.Deno?.env?.get?.(key) ?? globals.process?.env?.[key];
}

/**
 * The deployment every client talks to. An on-prem install sets this once
 * instead of passing `serverURL` at each construction site. The plain host
 * belongs here: the RPC prefix hook appends `/rpc/public` per request.
 */
export function serverURLFromEnv(): string | undefined {
  return readEnv("TEXTQL_SERVER_URL")?.trim() || undefined;
}

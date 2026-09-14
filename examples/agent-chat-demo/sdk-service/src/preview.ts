import type { ServerResponse } from "node:http";
import { once } from "node:events";
import type { Config } from "./sdk.js";
import { HttpError } from "./http.js";

const chartFitShim = `<style>html,body{margin:0!important;padding:0!important;}</style><script>(function(){var lw=0,lh=0;function measure(){var d=document.documentElement,b=document.body;var w=Math.max(d.scrollWidth,b?b.scrollWidth:0,d.offsetWidth);var h=Math.max(d.scrollHeight,b?b.scrollHeight:0,d.offsetHeight);if(w&&h&&(w!==lw||h!==lh)){lw=w;lh=h;parent.postMessage({__chartFit:true,w:w,h:h},'*');}}window.addEventListener('load',measure);[60,250,600,1200].forEach(function(t){setTimeout(measure,t);});try{new ResizeObserver(measure).observe(document.documentElement);}catch(e){}})();</script>`;

export async function previewProxy(
  params: URLSearchParams,
  config: Config,
  response: ServerResponse,
  fetcher: typeof fetch,
  signal: AbortSignal,
) {
  let url: URL;
  try {
    url = new URL(params.get("url") ?? "");
  } catch {
    throw new HttpError(400, "Invalid preview URL.");
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new HttpError(400, "Invalid preview URL.");
  }
  if (
    url.hostname !== config.appHost &&
    url.hostname !== config.usercontentHost &&
    !url.hostname.endsWith(`.${config.usercontentHost}`)
  ) {
    throw new HttpError(403, "Preview host is not allowed.");
  }
  const upstream = await fetcher(url, {
    redirect: "manual",
    signal: AbortSignal.any([signal, AbortSignal.timeout(60_000)]),
  });
  if (upstream.status >= 300 && upstream.status < 400) {
    await upstream.body?.cancel();
    throw new HttpError(502, "Preview redirects are not allowed.");
  }
  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  const headers = {
    "content-type": contentType,
    "content-disposition": "inline",
    "content-security-policy": "sandbox allow-scripts",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };
  if (upstream.ok && contentType.includes("text/html")) {
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (upstream.body) {
      for await (const chunk of upstream.body) {
        size += chunk.length;
        if (size > 20 * 1024 * 1024)
          throw new HttpError(502, "Preview HTML is too large.");
        chunks.push(chunk);
      }
    }
    let html = Buffer.concat(chunks).toString("utf8");
    const baseUrl = new URL(".", url).href
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;");
    const base = `<base href="${baseUrl}">`;
    html = /<head\b[^>]*>/i.test(html)
      ? html.replace(/<head\b[^>]*>/i, (head) => head + base)
      : base + html;
    if (params.get("fit") === "chart") {
      html = /<\/body>/i.test(html)
        ? html.replace(/<\/body>/i, chartFitShim + "</body>")
        : html + chartFitShim;
    }
    response.writeHead(upstream.status, headers);
    response.end(html);
    return;
  }
  response.writeHead(upstream.status, headers);
  if (upstream.body) {
    for await (const chunk of upstream.body) {
      if (!response.write(chunk)) await once(response, "drain", { signal });
    }
  }
  response.end();
}

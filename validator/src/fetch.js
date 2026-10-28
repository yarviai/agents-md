/** Where to look for a store's agents.md, given a domain or URL typed by a person. */
export function agentsMdUrl(input) {
  const raw = String(input).trim();
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!/\/agents\.md$/i.test(url.pathname)) url.pathname = "/agents.md";
  url.search = "";
  url.hash = "";
  url.protocol = "https:";
  return url;
}

export const USER_AGENT = "agents-md-validator/0.2 (+https://agents-md.org)";
export const MAX_BYTES = 256 * 1024;

/**
 * Fetches a store's agents.md over https. CLI use; the hosted validator wraps this with private-address checks.
 * @param {string} input
 * @param {{ fetchImpl?: typeof fetch, timeoutMs?: number }} [opts]
 */
export async function fetchAgentsMd(input, opts = {}) {
  const url = agentsMdUrl(input);
  const res = await (opts.fetchImpl ?? fetch)(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/markdown, text/plain;q=0.9, */*;q=0.1" },
    redirect: "follow",
    signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
  });
  const buf = new Uint8Array(await res.arrayBuffer());
  const text = new TextDecoder().decode(buf.slice(0, MAX_BYTES));
  return { url: res.url || url.toString(), status: res.status, contentType: res.headers.get("content-type"), text, truncated: buf.length > MAX_BYTES };
}

import childWorker from "./child";
import type { Env } from "./types";

function json(obj: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(obj, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });
}

function hardBlocked() {
  return new Response("Security Blocked (api.test.com)", {
    status: 403,
    headers: { "content-type": "text/plain" }
  });
}

// Role 1: Outbound Interceptor (fetch hook)
function makeOutboundInterceptor() {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    // Block requests to api.test.com entirely.
    if (url.hostname === "api.test.com") {
      return hardBlocked();
    }

    // Example: inject a dummy Authorization header for demonstration.
    const headers = new Headers(request.headers);
    if (!headers.has("authorization")) {
      headers.set("authorization", "Bearer DUMMY_TOKEN");
    }

    const forwarded = new Request(request, { headers });
    return fetch(forwarded);
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") return json({ ok: true, role: 1 });

    if (request.method === "POST" && url.pathname === "/run") {
      const body = await request.text();

      // Role 1: Parent Worker calls env.LOADER.load()
      // Tip: use globalOutbound: null first to prove total isolation.
      // Then swap to makeOutboundInterceptor() to demonstrate outbound controls.
      const mode = url.searchParams.get("outbound") ?? "blocked";
      const globalOutbound = mode === "blocked" ? null : makeOutboundInterceptor();

      const child = await env.LOADER.load<typeof childWorker>(JSON.stringify(childWorker), { globalOutbound });

      // call the child worker with the submitted payload
      const res = await child.fetch(new Request("https://child/run", { method: "POST", body }));
      return res;
    }

    if (url.pathname === "/outbound-test") {
      const mode = url.searchParams.get("outbound") ?? "intercept";
      const globalOutbound = mode === "blocked" ? null : makeOutboundInterceptor();
      const child = await env.LOADER.load<typeof childWorker>(JSON.stringify(childWorker), { globalOutbound });
      return child.fetch(new Request("https://child/outbound-test"));
    }

    return new Response("Parent worker up. POST /run", { headers: { "content-type": "text/plain" } });
  }
};


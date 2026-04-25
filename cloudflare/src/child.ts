export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/run") {
      // In a real setup you would execute user code in a safer sandbox.
      // For the sprint, we just prove the loader path works.
      const body = await request.text();
      return new Response(`Child worker ran. Got payload:\n${body}\n`, {
        headers: { "content-type": "text/plain" }
      });
    }

    if (url.pathname === "/outbound-test") {
      // This will be intercepted by the parent worker outbound hook.
      const res = await fetch("https://api.test.com/hello", { method: "GET" });
      return new Response(await res.text(), { headers: { "content-type": "text/plain" } });
    }

    return new Response("Child worker up", { headers: { "content-type": "text/plain" } });
  }
};


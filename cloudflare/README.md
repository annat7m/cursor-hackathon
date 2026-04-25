# Cloudflare (Role 1)

This folder contains the **Role 1: Cloud Infra Engineer** prototype from `steps.txt`:

- `wrangler.toml` with a `[[worker_loaders]]` binding
- A **Parent Worker** that accepts code via `POST` and calls `env.LOADER.load()`
- An **Outbound Interceptor** that blocks `api.test.com` or injects a dummy `Authorization` header

## Local dev

```bash
cd cloudflare
npm install
npm run dev
```

## Deploy

```bash
cd cloudflare
npm run deploy
```


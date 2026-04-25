# Browser VM Launcher (Cursor Hackathon)

Website where you **pick a Linux template → Start → interact with it in your browser**.

## Repo layout
- `frontend/`: Next.js UI (template picker + session viewer)
- `backend/`: Express API (creates/stops sessions, TTL cleanup, reverse-proxies viewer)
- `images/`: Docker image(s) for the disposable environments
- `infra/`: Compose for running the stack

## Quickstart (local)
Prereqs:
- Docker (Docker Desktop is fine)
- Node 20+ (optional if you run everything via Docker)

### 1) Build the session image
From repo root:

```bash
docker compose -f images/docker-compose.images.yml build
```

### 2) Run API + frontend

```bash
docker compose -f infra/docker-compose.yml up --build
```

Open:
- Frontend: `http://localhost:3000`
- API: `http://localhost:8080/healthz`

## How it works (MVP)
- `POST /sessions` starts a disposable container (Ubuntu XFCE web desktop).
- The API returns a stable `connectUrl` like `/connect/<id>/?token=...`.
- The frontend embeds the `connectUrl` in an iframe.
- TTL cleanup stops containers automatically.


To split this into a 3‑person, 2‑hour sprint, I’ll first skim your README.md to understand what the “job” is (scope, features, tech). Then I’ll propose a tight 2‑hour plan with clear ownership, parallel tasks, and a 15–20 minute integration/test buffer at the end.

3-person split to finish in 2 hours (your repo’s MVP)
Goal (from README.md): template picker → POST /sessions → get connectUrl → iframe embed → TTL cleanup.

Team roles (parallel, minimal overlap)
Person A — Frontend (Next.js)

Build Template Picker UI (hardcode 1–3 templates first).
“Start” button calls backend POST /sessions.
Session Viewer page that embeds connectUrl in an iframe and shows basic status/errors.
Add “Stop session” button if backend supports it (DELETE /sessions/:id or similar).
Person B — Backend (Express API + connect URL + proxy)

Implement POST /sessions returning { id, connectUrl }.
Implement GET /healthz.
Implement DELETE /sessions/:id (or POST /sessions/:id/stop) so frontend can stop.
Implement the /connect/:id route behavior (reverse-proxy to the container viewer) and token check (even a simple shared secret token is fine for MVP).
Person C — Docker/Infra (images + compose + TTL cleanup)

Ensure the session image builds (images/docker-compose.images.yml).
Ensure infra compose brings up frontend+backend (infra/docker-compose.yml).
Make session containers start with predictable labels/env so backend can manage them.
Implement TTL cleanup strategy (simplest MVP: backend interval job that stops sessions older than TTL by inspecting stored timestamps / container labels).
2-hour timebox (what to do when)
0:00–0:10 (All)

Agree on the API contract (exact request/response shapes) and environment variables.
Decide 1 happy-path template name (even if it maps to the same image).
0:10–1:10 (Parallel build)

A builds UI + wiring to the agreed endpoints.
B builds the endpoints + connect route returning something usable.
C makes compose+image reliably start and documents “run this” commands.
1:10–1:35 (Integration)

Wire frontend to real backend; fix CORS/URLs.
Confirm POST /sessions → get connectUrl → iframe loads.
Confirm stop works and containers actually stop.
1:35–1:55 (Stabilize)

Add basic error handling + loading states.
TTL cleanup verified (even with a 1–2 minute TTL temporarily to test).
1:55–2:00 (Demo prep)

Update README.md with exact demo steps and known limitations.
Critical “don’t get stuck” rules
Keep the contract tiny: POST /sessions must work end-to-end first, before adding multiple templates, auth, fancy proxying, etc.
Always reserve 20+ minutes for integration: most hackathon time loss is in “it works on my part” merges.
Define connectUrl early: whether it’s /connect/:id/?token=... or a full http://... URL—pick one and stick to it.
If you paste the current endpoint stubs (or list what exists in frontend/ and backend/), I can turn this into a concrete checklist with exact file-level ownership and an API schema everyone can implement without stepping on each other.
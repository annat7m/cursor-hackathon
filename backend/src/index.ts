import cors from "cors";
import express from "express";
import http from "node:http";
import { nanoid } from "nanoid";
import { z } from "zod";
import httpProxy from "http-proxy";
import { config } from "./config.js";
import { openDb, insertSession, getSession, updateSession, listExpiredSessions, type SessionRow } from "./db.js";
import { requireInviteCode } from "./http.js";
import { runSandboxedNodeCode, startSessionContainer, stopSessionContainer } from "./docker.js";
import { analyzeCode } from "./security/analyzeCode.js";
import { maskCredentials } from "./security/maskCredentials.js";

const app = express();
app.use(cors());
app.use(express.json());

const db = openDb(config.DB_PATH);

const templates = [
  {
    id: "ubuntu-xfce",
    name: "Ubuntu (XFCE Desktop)",
    description: "Disposable Ubuntu desktop in your browser (good default).",
    image: config.DOCKER_IMAGE_DEFAULT
  }
] as const;

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.get("/api/templates", (_req, res) => {
  res.json(templates.map(({ image: _image, ...rest }) => rest));
});

app.get("/templates", (_req, res) => {
  res.json(templates.map(({ image: _image, ...rest }) => rest));
});

const RunSchema = z.object({
  code: z.string().min(1).max(50_000)
});

app.post("/api/run", requireInviteCode, async (req, res) => {
  const parsed = RunSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const analysis = analyzeCode(parsed.data.code);
  if (!analysis.safe) {
    return res.status(200).json({
      ...analysis,
      success: false,
      stdout: "",
      stderr: "Blocked by security policy",
      latencyMs: 0
    });
  }

  const result = await runSandboxedNodeCode(parsed.data.code, { timeoutMs: 2500 });
  return res.status(200).json({
    ...analysis,
    ...result,
    stdout: maskCredentials(result.stdout),
    stderr: maskCredentials(result.stderr)
  });
});

const CreateSessionSchema = z.object({
  templateId: z.string().min(1)
});

function toApiSession(row: SessionRow) {
  const base = (config.PUBLIC_BASE_URL ?? `http://localhost:${config.PORT}`).replace(/\/+$/, "");
  return {
    id: row.id,
    templateId: row.templateId,
    status: row.status,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    connectUrl: row.connectUrl ?? (row.hostPort ? `${base}/connect/${row.id}/?token=${encodeURIComponent(row.token)}` : undefined)
  };
}

app.post("/sessions", requireInviteCode, async (req, res) => {
  const parsed = CreateSessionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const template = templates.find((t) => t.id === parsed.data.templateId);
  if (!template) return res.status(404).json({ error: "Unknown template" });

  const id = nanoid(12);
  const token = nanoid(22);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + config.SESSION_TTL_MINUTES * 60_000).toISOString();

  insertSession(db, {
    id,
    templateId: template.id,
    status: "starting",
    createdAt,
    expiresAt,
    containerId: null,
    hostPort: null,
    connectUrl: null,
    token
  });

  // Fire-and-forget startup; session can be polled.
  (async () => {
    try {
      const started = await startSessionContainer(id, template.image);
      updateSession(db, id, {
        status: "running",
        containerId: started.containerId,
        hostPort: started.hostPort,
        connectUrl: started.connectUrl
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed to start VM session ${id}:`, e);
      updateSession(db, id, { status: "error" });
    }
  })();

  const row = getSession(db, id)!;
  return res.status(201).json(toApiSession(row));
});

app.get("/sessions/:id", requireInviteCode, (req, res) => {
  const row = getSession(db, req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(toApiSession(row));
});

app.delete("/sessions/:id", requireInviteCode, async (req, res) => {
  const row = getSession(db, req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });

  if (row.containerId) await stopSessionContainer(row.containerId);
  updateSession(db, row.id, { status: "stopped", connectUrl: null, containerId: null, hostPort: null });
  return res.status(204).send();
});

function requireSessionToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const row = getSession(db, req.params.id);
  if (!row) return res.status(404).send("Not found");
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token || token !== row.token) return res.status(401).send("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req as any).sessionRow = row;
  return next();
}

const proxy = httpProxy.createProxyServer({
  ws: true,
  xfwd: true,
  changeOrigin: true
});

app.use("/connect/:id", requireSessionToken, (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = (req as any).sessionRow as SessionRow;
  if (!row.hostPort || row.status !== "running") return res.status(409).send("Session not ready");

  req.url = req.originalUrl.replace(new RegExp(`^/connect/${row.id}`), "");
  proxy.web(req, res, { target: `http://127.0.0.1:${row.hostPort}` });
});

// Cleanup loop (TTL)
setInterval(async () => {
  const nowIso = new Date().toISOString();
  const expired = listExpiredSessions(db, nowIso);
  for (const row of expired) {
    if (row.containerId) await stopSessionContainer(row.containerId);
    updateSession(db, row.id, { status: "stopped", connectUrl: null, containerId: null, hostPort: null });
  }
}, 15_000).unref();

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  try {
    const base = `http://${req.headers.host ?? "localhost"}`;
    const url = new URL(req.url ?? "/", base);
    const match = url.pathname.match(/^\/connect\/([^/]+)\//);
    if (!match) return;
    const sessionId = match[1]!;
    const row = getSession(db, sessionId);
    if (!row || !row.hostPort || row.status !== "running") return;
    if ((url.searchParams.get("token") ?? "") !== row.token) return;

    req.url = (req.url ?? "/").replace(new RegExp(`^/connect/${sessionId}`), "");
    proxy.ws(req, socket, head, { target: `http://127.0.0.1:${row.hostPort}` });
  } catch {
    // ignore
  }
});

server.listen(config.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${config.PORT}`);
});


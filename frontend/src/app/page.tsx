"use client";

import { useEffect, useMemo, useState } from "react";
import { createSession, listTemplates, type Session, type VmTemplate } from "../lib/api";

export default function HomePage() {
  const [templates, setTemplates] = useState<VmTemplate[] | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Session | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setTemplates(await listTemplates());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load templates");
      }
    })();
  }, []);

  const defaultTemplate = useMemo(() => templates?.[0]?.id ?? "", [templates]);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    if (!selected && defaultTemplate) setSelected(defaultTemplate);
  }, [selected, defaultTemplate]);

  async function onStart() {
    setStarting(true);
    setError(null);
    setCreated(null);
    try {
      const session = await createSession(selected, inviteCode || undefined);
      setCreated(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start session");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="panel">
      {error ? (
        <div className="error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      ) : null}

      <div className="grid">
        <div className="card">
          <h3 className="cardTitle">1) Pick a Linux template</h3>
          <p className="cardDesc">This launches a disposable environment with an in-browser desktop.</p>

          <div className="row" style={{ marginBottom: 12 }}>
            <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {(templates ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <button className="button" disabled={!selected || starting || !templates} onClick={onStart}>
              {starting ? "Starting..." : "Start"}
            </button>
          </div>

          <div className="row">
            <input
              className="input"
              placeholder="Invite code (if required)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <span className="pill">Sent as `x-invite-code`</span>
          </div>
        </div>

        <div className="card">
          <h3 className="cardTitle">2) Open your session</h3>
          <p className="cardDesc">Once it’s running, you’ll get a link to the in-browser desktop viewer.</p>

          {created ? (
            <div className="row">
              <a className="button" href={`/sessions/${created.id}`}>
                Open session
              </a>
              <span className="pill">expires {new Date(created.expiresAt).toLocaleString()}</span>
            </div>
          ) : (
            <span className="pill">No session yet</span>
          )}
        </div>
      </div>
    </div>
  );
}


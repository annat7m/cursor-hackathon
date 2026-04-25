"use client";

import { useEffect, useMemo, useState } from "react";
import { createSession, getSession, listTemplates, stopSession, type Session, type VmTemplate } from "../lib/api";

export default function HomePage() {
  const [templates, setTemplates] = useState<VmTemplate[] | null>(null);
  const [selected, setSelected] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const loadedTemplates = await listTemplates();
        if (cancelled) return;

        setTemplates(loadedTemplates);
        setSelected((current) => current || loadedTemplates[0]?.id || "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load VM templates");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session || session.status === "stopped" || session.status === "error") return;

    let cancelled = false;
    const refresh = async () => {
      try {
        const updated = await getSession(session.id, inviteCode || undefined);
        if (!cancelled) {
          setSession(updated);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to refresh VM status");
      }
    };

    const interval = window.setInterval(refresh, 2500);
    refresh();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [session?.id, session?.status, inviteCode]);

  const selectedTemplate = useMemo(() => templates?.find((template) => template.id === selected), [templates, selected]);
  const viewerUrl = session?.status === "running" ? session.connectUrl : undefined;

  async function onStart() {
    setStarting(true);
    setError(null);
    try {
      const created = await createSession(selected, inviteCode || undefined);
      setSession(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start VM");
    } finally {
      setStarting(false);
    }
  }

  async function onStop() {
    if (!session) return;

    setStopping(true);
    setError(null);
    try {
      await stopSession(session.id, inviteCode || undefined);
      setSession({ ...session, status: "stopped", connectUrl: undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop VM");
    } finally {
      setStopping(false);
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
          <h3 className="cardTitle">1) Pick a VM</h3>
          <p className="cardDesc">Choose the disposable browser VM and start it. The desktop opens below on this page.</p>

          <div className="row" style={{ marginBottom: 12 }}>
            <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)} disabled={!templates}>
              {(templates ?? []).map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>

            <button className="button" disabled={!selected || starting || !templates} onClick={onStart}>
              {starting ? "Starting..." : "Start VM"}
            </button>
          </div>

          <div className="row">
            <input
              className="input"
              placeholder="Invite code (if required)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <span className="pill">{selectedTemplate?.description ?? "Loading VM template..."}</span>
          </div>
        </div>

        <div className="card">
          <h3 className="cardTitle">2) Session controls</h3>
          <p className="cardDesc">Use Stop when you are done so the VM shuts down cleanly.</p>

          <div className="row">
            <span className="pill">status: {session?.status ?? "no VM yet"}</span>
            {session?.expiresAt ? <span className="pill">expires {new Date(session.expiresAt).toLocaleString()}</span> : null}
            <button className="button buttonDanger" disabled={!session || session.status === "stopped" || stopping} onClick={onStop}>
              {stopping ? "Stopping..." : "Stop VM"}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14, gridColumn: "span 12" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h3 className="cardTitle">3) Browser VM window</h3>
            <p className="cardDesc">The VM stays embedded here, so you can stop it from this same page.</p>
          </div>
          {session?.id ? <code>{session.id}</code> : <span className="pill">No session yet</span>}
        </div>

        {viewerUrl ? (
          <iframe className="viewerFrame" title="Browser VM" src={viewerUrl} style={{ height: 520 }} />
        ) : (
          <div className="pill">
            {session ? "Waiting for the VM to become ready..." : "Start the VM to open it here."}
          </div>
        )}
      </div>
    </div>
  );
}


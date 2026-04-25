"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession, stopSession, type Session } from "../../../lib/api";

type Props = { params: { id: string } };

export default function SessionPage({ params }: Props) {
  const sessionId = params.id;
  const [inviteCode, setInviteCode] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);

  const viewerUrl = useMemo(() => session?.connectUrl, [session]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await getSession(sessionId, inviteCode || undefined);
        if (!cancelled) {
          setSession(s);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to refresh session");
      }
    };

    tick();
    const interval = window.setInterval(tick, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sessionId, inviteCode]);

  async function onStop() {
    setStopping(true);
    try {
      await stopSession(sessionId, inviteCode || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop session");
    } finally {
      setStopping(false);
    }
  }

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <div className="row">
          <span className="pill">session</span>
          <code>{sessionId}</code>
          <span className="pill">{session?.status ?? "loading"}</span>
          {session?.expiresAt ? <span className="pill">expires {new Date(session.expiresAt).toLocaleString()}</span> : null}
        </div>

        <div className="row">
          <input
            className="input"
            placeholder="Invite code (if required)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
          <button className="button buttonDanger" onClick={onStop} disabled={stopping}>
            {stopping ? "Stopping..." : "Stop"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      ) : null}

      {viewerUrl ? (
        <iframe className="viewerFrame" src={viewerUrl} />
      ) : (
        <div className="pill">Waiting for session to become ready…</div>
      )}
    </div>
  );
}


export type VmTemplate = {
  id: string;
  name: string;
  description: string;
};

export type Session = {
  id: string;
  templateId: string;
  status: "starting" | "running" | "stopped" | "error";
  createdAt: string;
  expiresAt: string;
  connectUrl?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

export async function listTemplates(): Promise<VmTemplate[]> {
  const res = await fetch(`${API_BASE}/templates`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to list templates (${res.status})`);
  return res.json();
}

export async function createSession(templateId: string, inviteCode?: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(inviteCode ? { "x-invite-code": inviteCode } : {})
    },
    body: JSON.stringify({ templateId })
  });
  if (!res.ok) throw new Error(`Failed to create session (${res.status})`);
  return res.json();
}

export async function getSession(id: string, inviteCode?: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(id)}`, {
    headers: {
      ...(inviteCode ? { "x-invite-code": inviteCode } : {})
    },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Failed to fetch session (${res.status})`);
  return res.json();
}

export async function stopSession(id: string, inviteCode?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      ...(inviteCode ? { "x-invite-code": inviteCode } : {})
    }
  });
  if (!res.ok) throw new Error(`Failed to stop session (${res.status})`);
}


"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

function Toast({ message, type, onClose }) {
  return (
    <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg font-bold text-lg flex items-center gap-2 ${type === "success" ? "bg-neon-green text-black" : "bg-red-600 text-white"}`}>
      {type === "success" ? <span>✅</span> : <span>⚠️</span>}
      {message}
      <button className="ml-4 text-xl" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}

export default function HomePage() {
  const [code, setCode] = useState("console.log('hello world')");
  const [trace, setTrace] = useState([]);
  const [latency, setLatency] = useState(null);
  const [security, setSecurity] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle");
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);

  async function runCode() {
    setLoading(true);
    setError(null);
    setStatus("scanning");
    setTrace(["Scanning code for security issues..."]);
    try {
      const start = performance.now();
      const res = await fetch("http://localhost:8080/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setLatency(Math.round(performance.now() - start));
      setSecurity({ safe: data.safe, risk_score: data.risk_score, reason: data.reason });
      setResult({ stdout: data.stdout, stderr: data.stderr });
      setTrace((t) => [
        ...t,
        data.safe ? "Security Approved" : "Security Blocked",
        `Reason: ${data.reason}`,
        data.safe ? "Running code in sandbox..." : "Execution blocked.",
        data.stdout ? `stdout: ${data.stdout}` : "",
        data.stderr ? `stderr: ${data.stderr}` : ""
      ]);
      setStatus(data.safe ? "completed" : "blocked");
      setToast({ message: data.safe ? `Success! Latency: ${Math.round(performance.now() - start)}ms` : `Blocked: ${data.reason}`, type: data.safe ? "success" : "error" });
      setHistory((h) => [{ code, result: data.stdout, time: new Date().toLocaleTimeString() }, ...h].slice(0, 10));
    } catch (e) {
      setError(e.message || "Failed to run code");
      setTrace((t) => [...t, "Error running code"]);
      setStatus("error");
      setToast({ message: "Error running code", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setCode("");
    setTrace([]);
    setLatency(null);
    setSecurity(null);
    setResult(null);
    setStatus("idle");
    setError(null);
  }

  function getStatusText() {
    switch (status) {
      case "scanning": return "🔎 Scanning...";
      case "approved": return "✅ Security Approved";
      case "blocked": return "⛔ Security Blocked";
      case "running": return "⚡ Running...";
      case "completed": return "🎉 Completed";
      case "error": return "⚠️ Error";
      default: return "Idle";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white flex flex-col font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <header className="p-6 pb-2 flex flex-col md:flex-row items-center justify-between gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-neon-orange drop-shadow-neon flex items-center gap-2">
          <span role="img" aria-label="shield">🛡️</span> Sentinel AI Isolate
        </h1>
        <span className="text-neon-green font-mono text-lg">Zero-Trust Execution Layer</span>
      </header>
      <div className="flex flex-col md:flex-row flex-1 gap-6 px-6 pb-6">
        {/* Left: Monaco Editor Card */}
        <div className="flex-1 bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col mb-6 md:mb-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-neon-orange flex items-center gap-2">
              <span role="img" aria-label="edit">✍️</span> Code Editor
            </h2>
            <button
              className="px-3 py-1 bg-gray-800 text-neon-orange rounded hover:bg-gray-700 border border-neon-orange text-sm"
              onClick={clearAll}
              title="Clear editor and results"
            >Clear</button>
          </div>
          <div className="flex-1 min-h-0 mb-4 rounded-lg overflow-hidden border-2 border-neon-orange">
            <MonacoEditor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          <button
            className="mt-2 px-6 py-2 bg-neon-orange text-black font-bold rounded-lg shadow hover:scale-105 transition-transform flex items-center gap-2"
            onClick={runCode}
            disabled={loading}
            title="Run code in secure sandbox"
          >
            <span role="img" aria-label="run">🚀</span> {loading ? "Running..." : "Run"}
          </button>
        </div>
        {/* Middle: Latency & Security Card */}
        <div className="flex flex-col items-center justify-center flex-1 bg-gray-950 rounded-2xl shadow-lg p-6 mx-2 mb-6 md:mb-0">
          <div className="flex flex-col items-center mb-6">
            <span className="text-5xl font-extrabold text-neon-green drop-shadow-neon mb-2 flex items-center gap-2">
              <span role="img" aria-label="timer">⏱️</span> {latency !== null ? `${latency}ms` : "-"}
            </span>
            <span className="uppercase tracking-widest text-gray-400 text-xs">Latency</span>
          </div>
          {security && (
            <div className={`px-6 py-3 rounded-xl text-lg font-bold shadow flex items-center gap-2 ${security.safe ? "bg-neon-green text-black" : "bg-red-700 text-white"} mb-3`}>
              {security.safe ? <span role="img" aria-label="approved">✅</span> : <span role="img" aria-label="blocked">⛔</span>}
              {security.safe ? "Security Approved" : "Security Blocked"}
            </div>
          )}
          <div className="text-neon-orange text-center text-base mt-2 font-mono">
            {getStatusText()}
          </div>
          {security && (
            <div className="text-orange-200 text-center text-sm mt-2">
              {security.reason}
            </div>
          )}
        </div>
        {/* Right: Security Trace Card */}
        <div className="flex-1 bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-neon-orange flex items-center gap-2">
              <span role="img" aria-label="shield">🛡️</span> Security Trace
            </h2>
            <span className="text-gray-400 text-xs" title="Shows the security scan and execution steps">What happened?</span>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg h-64 overflow-y-auto border border-neon-orange">
            {trace.map((t, i) => (
              t ? <div key={i} className="text-neon-orange font-mono mb-1 flex items-center gap-2"><span role="img" aria-label="trace">🔸</span>{t}</div> : null
            ))}
          </div>
        </div>
      </div>
      {/* History Panel */}
      <div className="mx-6 mb-2 mt-2 bg-gray-900 rounded-2xl shadow p-4 border-l-4 border-neon-orange">
        <h2 className="text-lg font-semibold text-neon-orange mb-2 flex items-center gap-2"><span role="img" aria-label="history">🕑</span>History (last 10 runs)</h2>
        <div className="flex flex-wrap gap-2">
          {history.length === 0 && <span className="text-gray-400">No history yet.</span>}
          {history.map((h, i) => (
            <div key={i} className="bg-gray-800 rounded p-2 text-xs text-neon-green font-mono border border-neon-orange">
              <div><b>Time:</b> {h.time}</div>
              <div><b>Code:</b> {h.code.slice(0, 40)}{h.code.length > 40 ? "..." : ""}</div>
              <div><b>Result:</b> {h.result.slice(0, 40)}{h.result.length > 40 ? "..." : ""}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Result Card */}
      <div className="mx-6 mb-6 mt-2 bg-gray-950 rounded-2xl shadow-lg p-6 border-t-4 border-neon-orange">
        <h2 className="text-xl font-semibold mb-2 text-neon-orange flex items-center gap-2"><span role="img" aria-label="output">📤</span>Result</h2>
        {error && <div className="text-red-400 mb-2 font-bold">{error}</div>}
        <div className="bg-gray-800 p-3 rounded-lg text-neon-green min-h-10 font-mono">
          {result ? (
            <>
              <div><b>stdout:</b> {result.stdout}</div>
              {result.stderr && <div><b>stderr:</b> {result.stderr}</div>}
            </>
          ) : "-"}
        </div>
      </div>
      <style jsx global>{`
        .text-neon-orange { color: #ff9100; }
        .bg-neon-orange { background: #ff9100; }
        .border-neon-orange { border-color: #ff9100; }
        .text-neon-green { color: #39ff14; }
        .bg-neon-green { background: #39ff14; }
        .drop-shadow-neon { text-shadow: 0 0 8px #ff9100, 0 0 16px #39ff14; }
      `}</style>
    </div>
  );
}


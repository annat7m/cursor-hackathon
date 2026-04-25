import React, { useState } from "react";

export default function HomePage() {
  const [code, setCode] = useState("");
  const [trace, setTrace] = useState<string[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [security, setSecurity] = useState<{ safe: boolean; risk_score: number; reason: string } | null>(null);
  const [result, setResult] = useState<{ stdout: string; stderr: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runCode() {
    setLoading(true);
    setError(null);
    setTrace((t) => [...t, "Scanning code for security issues..."]);
    const start = performance.now();
    try {
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
        "Running code in sandbox...",
        `stdout: ${data.stdout}`,
        data.stderr ? `stderr: ${data.stderr}` : ""
      ]);
    } catch (e: any) {
      setError(e.message || "Failed to run code");
      setTrace((t) => [...t, "Error running code"]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex flex-row flex-1">
        {/* Left: Code Editor */}
        <div className="w-1/3 p-4 bg-gray-900">
          <h2 className="text-lg mb-2">Code Editor</h2>
          <textarea
            className="w-full h-64 bg-gray-800 text-green-400 p-2 rounded"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Type your code here..."
          />
          <button
            className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded"
            onClick={runCode}
            disabled={loading}
          >
            {loading ? "Running..." : "Run"}
          </button>
        </div>
        {/* Middle: Latency & Security */}
        <div className="w-1/3 flex flex-col items-center justify-center bg-gray-950">
          <div className="text-4xl text-green-400 mb-4">
            Latency: {latency !== null ? `${latency}ms` : "-"}
          </div>
          {security && (
            <div className={`px-4 py-2 rounded ${security.safe ? "bg-green-800" : "bg-red-800"} mb-2`}>
              {security.safe ? "Security Approved" : "Security Blocked"}
            </div>
          )}
          {security && (
            <div className="text-orange-300 text-center text-sm mt-2">
              {security.reason}
            </div>
          )}
        </div>
        {/* Right: Security Trace */}
        <div className="w-1/3 p-4 bg-gray-900">
          <h2 className="text-lg mb-2">Security Trace</h2>
          <div className="bg-gray-800 p-2 rounded h-64 overflow-y-auto">
            {trace.map((t, i) => (
              t ? <div key={i} className="text-orange-400">{t}</div> : null
            ))}
          </div>
        </div>
      </div>
      {/* Result */}
      <div className="p-4 bg-gray-950 border-t border-gray-800">
        <h2 className="text-lg mb-2">Result</h2>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <div className="bg-gray-800 p-2 rounded text-green-400 min-h-10">
          {result ? (
            <>
              <div><b>stdout:</b> {result.stdout}</div>
              {result.stderr && <div><b>stderr:</b> {result.stderr}</div>}
            </>
          ) : "-"}
        </div>
      </div>
    </div>
  );
}
            <span className="pill">No session yet</span>
          )}
        </div>
      </div>
    </div>
  );
}


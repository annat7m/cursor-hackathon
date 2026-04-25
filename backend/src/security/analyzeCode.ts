export type CodeAnalysis = {
  safe: boolean;
  risk_score: number;
  reason: string;
};

const RULES: Array<{ pattern: RegExp; score: number; reason: string }> = [
  { pattern: /\beval\s*\(/, score: 90, reason: "Uses eval()" },
  { pattern: /\bFunction\s*\(/, score: 90, reason: "Uses Function() constructor" },
  { pattern: /\bprocess\.env\b/, score: 85, reason: "Accesses process.env" },
  { pattern: /\brequire\s*\(\s*['"]fs['"]\s*\)/, score: 85, reason: "Attempts filesystem access (fs)" },
  { pattern: /\brequire\s*\(\s*['"]child_process['"]\s*\)/, score: 95, reason: "Attempts shell execution (child_process)" },
  { pattern: /\bfetch\s*\(/, score: 70, reason: "Attempts network access (fetch)" },
  { pattern: /\brequire\s*\(\s*['"]http['"]\s*\)/, score: 70, reason: "Attempts network access (http)" },
  { pattern: /\brequire\s*\(\s*['"]https['"]\s*\)/, score: 70, reason: "Attempts network access (https)" },
  { pattern: /\brequire\s*\(\s*['"]net['"]\s*\)/, score: 75, reason: "Attempts raw socket access (net)" }
];

export function analyzeCode(code: string): CodeAnalysis {
  let max = 0;
  const reasons: string[] = [];

  for (const r of RULES) {
    if (r.pattern.test(code)) {
      max = Math.max(max, r.score);
      reasons.push(r.reason);
    }
  }

  if (max === 0) {
    return { safe: true, risk_score: 12, reason: "No risky patterns detected" };
  }

  // Keep it simple: any match blocks for MVP.
  return { safe: false, risk_score: max, reason: reasons.join("; ") };
}


export type CodeRisk = {
  label: string;
  detail: string;
  score: number;
  pattern: RegExp;
};

export type CodeAnalysis = {
  safe: boolean;
  risk_score: number;
  reason: string;
  findings: Array<{
    label: string;
    detail: string;
  }>;
};

const RISK_RULES: CodeRisk[] = [
  {
    label: "Dynamic eval",
    detail: "Uses eval(), which can execute arbitrary generated code.",
    score: 35,
    pattern: /\beval\s*\(/i
  },
  {
    label: "Function constructor",
    detail: "Uses Function(...), another dynamic code execution path.",
    score: 35,
    pattern: /\b(?:new\s+)?Function\s*\(/i
  },
  {
    label: "Environment access",
    detail: "Reads process.env, which could expose secrets or API keys.",
    score: 40,
    pattern: /\bprocess\s*\.\s*env\b/i
  },
  {
    label: "Filesystem access",
    detail: "Attempts to use Node filesystem APIs.",
    score: 30,
    pattern: /\b(?:require\s*\(\s*["'](?:node:)?fs(?:\/promises)?["']\s*\)|from\s+["'](?:node:)?fs(?:\/promises)?["']|fs\s*\.\s*(?:read|write|append|create|rm|unlink|readdir|stat|open))/i
  },
  {
    label: "Network access",
    detail: "Attempts outbound network access with fetch/http/net APIs.",
    score: 30,
    pattern: /\b(?:fetch\s*\(|require\s*\(\s*["'](?:node:)?(?:http|https|net|tls|dns)["']\s*\)|from\s+["'](?:node:)?(?:http|https|net|tls|dns)["'])/i
  },
  {
    label: "Shell execution",
    detail: "Attempts to spawn a process or use child_process.",
    score: 45,
    pattern: /\b(?:require\s*\(\s*["'](?:node:)?child_process["']\s*\)|from\s+["'](?:node:)?child_process["']|child_process|exec\s*\(|execFile\s*\(|spawn\s*\()/i
  },
  {
    label: "Sandbox escape attempt",
    detail: "References common globals used to inspect or bypass the runtime.",
    score: 25,
    pattern: /\b(?:globalThis\s*\.\s*process|constructor\s*\.\s*constructor|import\s*\(\s*["'](?:node:)?(?:vm|module)["']\s*\))/i
  }
];

export function analyzeCode(code: string): CodeAnalysis {
  const matchedRules = RISK_RULES.filter((rule) => rule.pattern.test(code));
  const findings = matchedRules.map(({ label, detail }) => ({ label, detail }));

  const riskScore = Math.min(100, matchedRules.reduce((total, rule) => total + rule.score, 0));

  if (findings.length === 0) {
    return {
      safe: true,
      risk_score: 0,
      reason: "No risky patterns detected",
      findings: []
    };
  }

  return {
    safe: false,
    risk_score: riskScore,
    reason: findings.map((finding) => finding.detail).join(" "),
    findings
  };
}

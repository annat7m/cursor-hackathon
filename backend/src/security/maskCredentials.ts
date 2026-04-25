const SECRET_PATTERNS: RegExp[] = [
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{35}\b/g,
  /\bgh[pousr]_[0-9A-Za-z_]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g
];

const ASSIGNMENT_PATTERNS: RegExp[] = [
  /\b((?:api[_-]?key|secret|token|password|authorization)\s*[:=]\s*["']?)([^"'\s,;]{8,})/gi,
  /\b(Bearer\s+)([A-Za-z0-9._-]{12,})/gi
];

export function maskCredentials(value: string): string {
  let masked = value;

  for (const pattern of SECRET_PATTERNS) {
    masked = masked.replace(pattern, "***");
  }

  for (const pattern of ASSIGNMENT_PATTERNS) {
    masked = masked.replace(pattern, "$1***");
  }

  return masked;
}

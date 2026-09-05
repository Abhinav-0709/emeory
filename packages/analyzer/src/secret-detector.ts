import * as path from 'node:path';

/**
 * Common file/directory patterns that must NEVER be ingested into memory (ADR-019)
 */
const SENSITIVE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /.*id_rsa.*/i,
  /.*id_ed25519.*/i,
  /.*\.pem$/i,
  /.*\.key$/i,
  /.*\.pkcs12$/i,
  /.*\.pfx$/i,
  /credentials\.json$/i,
  /service-account.*\.json$/i,
];

/**
 * Detects if a file path matches secret or credential patterns
 */
export function isSensitiveFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(fileName));
}

/**
 * Scans content lines for obvious raw secrets (API keys, tokens, passwords)
 */
export function containsRawSecrets(content: string): boolean {
  const secretPatterns = [
    /-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----/,
    /AIza[0-9A-Za-z-_]{35}/, // Google API Key
    /sk-[a-zA-Z0-9]{32,}/,  // OpenAI secret key
    /ghp_[a-zA-Z0-9]{36}/,  // GitHub Personal Access Token
    /xox[baprs]-[0-9a-zA-Z]{10,48}/, // Slack Token
    /password\s*=\s*['"][^'"]{6,}['"]/i,
  ];

  return secretPatterns.some((p) => p.test(content));
}

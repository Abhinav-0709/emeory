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
 * Calculates Shannon entropy of a string
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies = new Map<string, number>();
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  const len = str.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Well-known, high-confidence secret patterns (API keys, tokens, private keys)
 */
const KNOWN_SECRET_PATTERNS = [
  /-----BEGIN (?:[A-Z0-9_\-]+ )?PRIVATE KEY-----/,
  /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/,          // AWS Access Key ID
  /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,255}\b/,   // GitHub PAT / OAuth token
  /\bsk-[a-zA-Z0-9]{32,}\b/,                         // OpenAI API key (legacy)
  /\bsk-proj-[a-zA-Z0-9_\-]{48,}\b/,                 // OpenAI project key
  /\bsk-ant-[a-zA-Z0-9_\-]{32,}\b/,                  // Anthropic API key
  /\bgsk_[a-zA-Z0-9]{48,}\b/,                        // Groq API key
  /\bAIza[0-9A-Za-z\-_]{35}\b/,                      // Google API key
  /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/,               // Slack Token
  /\b(sk|rk)_(live|test)_[0-9a-zA-Z]{24,99}\b/,      // Stripe API key
  /(?:password|passwd|secret|api_key|apikey|access_token|auth_token)\s*[:=]\s*['"][^'"]{8,}['"]/i, // Variable assignments
];

/**
 * Checks if a string is a non-secret hash, identifier, or media blob:
 * - Pure hexadecimal (e.g. Git commit SHA, SHA-256, MD5)
 * - Standard UUID
 * - Base64 Data URI (e.g. data:image/png;base64,...)
 * - Package integrity hash (e.g. sha512-...)
 */
export function isNonSecretArtifact(token: string): boolean {
  // Pure hex strings (Git commit SHAs, SHA-256 hashes, etc.)
  if (/^[0-9a-fA-F]{32,64}$/.test(token)) {
    return true;
  }
  // Standard UUID
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(token)) {
    return true;
  }
  // Data URIs and base64 media markers
  if (token.startsWith('data:') || token.startsWith('sha256-') || token.startsWith('sha384-') || token.startsWith('sha512-')) {
    return true;
  }
  return false;
}

/**
 * Scans content lines for obvious raw secrets (API keys, tokens, passwords)
 * Uses high-confidence pattern matching and contextual entropy analysis.
 */
export function containsRawSecrets(content: string): boolean {
  // 1. Direct high-confidence signature patterns
  if (KNOWN_SECRET_PATTERNS.some((p) => p.test(content))) {
    return true;
  }

  // 2. Contextual entropy: Look for high-entropy tokens in credential contexts
  const credentialContextRegex = /(?:key|secret|token|auth|bearer|credential|password)\s*[:=]\s*['"`]?([A-Za-z0-9_\-\.\+/]{20,})['"`]?/gi;
  let match: RegExpExecArray | null;
  while ((match = credentialContextRegex.exec(content)) !== null) {
    const token = match[1];
    if (token && !isNonSecretArtifact(token)) {
      // If length >= 24 and Shannon entropy is high (>= 4.5), and contains mixed character sets
      if (token.length >= 24 && calculateShannonEntropy(token) >= 4.5) {
        if (/[A-Za-z]/.test(token) && /[0-9_\-]/.test(token)) {
          return true;
        }
      }
    }
  }

  return false;
}


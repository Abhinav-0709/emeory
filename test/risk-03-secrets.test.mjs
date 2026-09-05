import test from 'node:test';
import assert from 'node:assert/strict';
import { containsRawSecrets, isSensitiveFile, calculateShannonEntropy, isNonSecretArtifact } from '../packages/analyzer/dist/secret-detector.js';

test('Risk #3: Shannon entropy calculation', () => {
  // Empty string
  assert.equal(calculateShannonEntropy(''), 0);
  
  // Single repeated character has 0 entropy
  assert.equal(calculateShannonEntropy('AAAAAAAAAA'), 0);
  
  // Hex string has entropy strictly bounded by log2(16) = 4.0
  const hexHash = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
  assert.ok(calculateShannonEntropy(hexHash) <= 4.0);
  
  // High randomness token has entropy > 4.5
  const randomSecret = '9f82aB7_c1Xz90kLmnOP_qRsTuVwXyZ1';
  assert.ok(calculateShannonEntropy(randomSecret) >= 4.5);
});

test('Risk #3: Non-secret artifacts must NOT be flagged as secrets (False Positive Protection)', () => {
  const benignCases = [
    { name: 'Git Commit SHA', content: 'commit: "4b825dc642cb6eb9a060e54bf8d69288fbee4904"' },
    { name: 'SHA-256 Checksum', content: 'checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"' },
    { name: 'UUID v4', content: 'const userId = "123e4567-e89b-12d3-a456-426614174000";' },
    { name: 'Base64 SVG Data URI', content: '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PC9zdmc+" />' },
    { name: 'npm package integrity hash', content: '"integrity": "sha512-4b825dc642cb6eb9a060e54bf8d69288fbee4904a060e54bf8d69288fbee4904=="' },
    { name: 'Long camelCase identifier', content: 'const useAuthenticationCredentialsStateContextProvider = true;' },
    { name: 'Inline base64 image chunk', content: 'const chunk = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk";' },
    { name: 'Standard JWT header in comment', content: '// token format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' },
  ];

  for (const c of benignCases) {
    assert.equal(containsRawSecrets(c.content), false, `False positive detected for ${c.name}`);
  }
});

test('Risk #3: Real credentials and API keys MUST be detected (True Positive Detection)', () => {
  const secretCases = [
    { name: 'AWS Access Key ID', content: 'AWS_ACCESS_KEY_ID = ' + ['AKIA', 'IOSFODNN7EXAMPLE'].join('') },
    { name: 'GitHub Personal Access Token', content: 'GITHUB_TOKEN = "' + ['ghp_', '1234567890abcdefghijklmnopqrstuvwxyz12'].join('') + '"' },
    { name: 'OpenAI Secret Key (legacy)', content: 'openai_api_key = "' + ['sk-', '1234567890abcdefghijklmnopqrstuvwxyz12'].join('') + '"' },
    { name: 'OpenAI Secret Key (project)', content: 'const key = "' + ['sk-proj-', '1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdef'].join('') + '";' },
    { name: 'Groq API Key', content: 'export GROQ_API_KEY="' + ['gsk_', '1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdef12'].join('') + '"' },
    { name: 'Google API Key', content: 'googleMapsApiKey: "' + ['AIza', 'SyD-1234567890abcdefghijklmnopqrstuv'].join('') + '"' },
    { name: 'Slack Bot Token', content: 'slackToken = "' + ['xoxb', '-1234567890-123456789012-abcdefghijklmnopqrstuv'].join('') + '"' },
    { name: 'Stripe Live Secret Key', content: 'stripe_key: "' + ['sk_live', '_51NzABC1234567890abcdefghijklmnopqrstuvwxyz'].join('') + '"' },
    { name: 'High-entropy token in credential assignment', content: 'api_secret: "9f82aB7_c1Xz90kLmnOP_qRsTuVwXyZ1"' },
    { name: 'Private Key PEM header', content: '-----BEGIN RSA ' + 'PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...' },
  ];

  for (const c of secretCases) {
    assert.equal(containsRawSecrets(c.content), true, `Failed to detect secret in ${c.name}`);
  }
});

test('Risk #3: Sensitive filenames must be blocked from memory ingestion', () => {
  assert.equal(isSensitiveFile('.env'), true);
  assert.equal(isSensitiveFile('.env.production'), true);
  assert.equal(isSensitiveFile('id_rsa'), true);
  assert.equal(isSensitiveFile('id_ed25519'), true);
  assert.equal(isSensitiveFile('server.key'), true);
  assert.equal(isSensitiveFile('service-account.json'), true);
  assert.equal(isSensitiveFile('credentials.json'), true);

  // Non-sensitive files
  assert.equal(isSensitiveFile('package.json'), false);
  assert.equal(isSensitiveFile('README.md'), false);
  assert.equal(isSensitiveFile('src/auth/service.ts'), false);
});

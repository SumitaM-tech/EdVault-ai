import { describe, it, expect } from 'vitest';
import { extractCredentialId } from './api';

describe('extractCredentialId', () => {
  it('accepts a bare id', () => {
    expect(extractCredentialId('CRED-ABC123')).toBe('CRED-ABC123');
    expect(extractCredentialId('  CRED-ABC123  ')).toBe('CRED-ABC123');
  });
  it('extracts the id from a scanned verification URL', () => {
    expect(extractCredentialId('http://localhost:5173/verify/CRED-1A2B3C')).toBe('CRED-1A2B3C');
    expect(extractCredentialId('https://edvault.example/verify/CRED-1A2B3C?x=1')).toBe('CRED-1A2B3C');
  });
  it('still understands the legacy edvault:// payload', () => {
    expect(extractCredentialId('edvault://credential/CRED-OLD1')).toBe('CRED-OLD1');
  });
});

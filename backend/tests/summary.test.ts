import { describe, it, expect } from 'vitest';
import { summarizeAcademicProfile } from '../src/services/groq.service.js';

describe('AI summary', () => {
  it('falls back to a readable offline summary when Groq is not configured', async () => {
    delete process.env.GROQ_API_KEY;
    const out = await summarizeAcademicProfile([
      { title: 'B.E. CSE', institution: 'DSCE', cgpa: '8.9', issuedAt: new Date('2025-06-01') },
    ]);
    expect(out).toContain('1 verified credential');
    expect(out).toContain('8.9');
    expect(out.startsWith('[')).toBe(false);
  });
});

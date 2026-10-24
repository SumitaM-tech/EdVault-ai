import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createCredentialSchema = z.object({
  studentName: z.string().min(2),
  studentId: z.string().min(2),
  studentEmail: z.string().email().optional(),
  institution: z.string().min(2),
  degree: z.string().min(2),
  department: z.string().min(2),
  cgpa: z.string().min(1),
  gradDate: z.string().min(4),
  title: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;

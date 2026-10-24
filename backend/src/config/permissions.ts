/**
 * Single source of truth for role-based access control (RBAC).
 *
 * ADMIN     - platform owner: everything, plus user management, revoking any credential,
 *             access logs, compliance reports and fraud insights.
 * FACULTY   - issuing institution staff: issue credentials, OCR, email, dashboard,
 *             revoke ONLY credentials they issued themselves.
 * RECRUITER - external verifier: verify credentials, search students. No issuing, no analytics.
 * STUDENT   - credential owner: own passport, share links, AI summary, own DID.
 */
export const ROLES = ['ADMIN', 'FACULTY', 'RECRUITER', 'STUDENT'] as const;
export type RoleName = (typeof ROLES)[number];

export const ADMIN_ONLY: RoleName[] = ['ADMIN'];
export const STAFF: RoleName[] = ['ADMIN', 'FACULTY'];
export const STAFF_AND_RECRUITER: RoleName[] = ['ADMIN', 'FACULTY', 'RECRUITER'];
export const SHARERS: RoleName[] = ['ADMIN', 'FACULTY', 'STUDENT'];

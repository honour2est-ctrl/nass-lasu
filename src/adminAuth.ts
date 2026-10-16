// ============================================================================
// ADMIN ACCESS LISTS  (single source of truth for the website code)
// ----------------------------------------------------------------------------
// SUPER ADMINS  - full access to everything in the Admin Panel.
// MEDIA OFFICERS - limited access: Events & Galleries and News Flash only.
//
// This is a UX convenience check (so people see a clear message instead of
// confusing permission errors). The REAL security boundary is enforced
// server-side in firestore.rules and storage.rules.
//
// IMPORTANT: If you add or remove an email here, make the exact same change
// in firestore.rules and storage.rules (the isSuperAdmin() / isOfficer()
// functions), or the two will fall out of sync and writes will silently fail.
// ============================================================================

export const SUPER_ADMIN_EMAILS: string[] = [
  'honour2est@gmail.com',
  'ekopeters@gmail.com',
];

export const MEDIA_OFFICER_EMAILS: string[] = [
  'akachukwuezekiel40@gmail.com',
  'inioluwaadelegan5@gmail.com',
];

// Kept under its old name so existing imports keep working.
export const ADMIN_EMAILS: string[] = SUPER_ADMIN_EMAILS;

const norm = (email?: string | null) => (email || '').toLowerCase().trim();

/** Full admin access. */
export const isAuthorizedAdmin = (email?: string | null): boolean =>
  !!email && SUPER_ADMIN_EMAILS.some((e) => norm(e) === norm(email));

/** Limited access: Events & News Flash only (super admins are never "limited"). */
export const isLimitedOfficer = (email?: string | null): boolean =>
  !!email && !isAuthorizedAdmin(email) && MEDIA_OFFICER_EMAILS.some((e) => norm(e) === norm(email));

/** Anyone allowed through the admin login at all. */
export const isStaffEmail = (email?: string | null): boolean =>
  isAuthorizedAdmin(email) || isLimitedOfficer(email);

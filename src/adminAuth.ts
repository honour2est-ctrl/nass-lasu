// ============================================================================
// ADMIN ACCESS LIST
// ----------------------------------------------------------------------------
// Only Google accounts listed here are allowed to use the Admin Panel.
// This is a UX convenience check (so unauthorized users see a clear message
// instead of confusing Firestore permission errors) — the REAL security
// boundary is enforced server-side in firestore.rules.
//
// IMPORTANT: If you add or remove an email here, you MUST make the exact
// same change in firestore.rules (the `isAdmin()` function), or the two
// will fall out of sync and admin writes will silently fail.
// ============================================================================

export const ADMIN_EMAILS: string[] = [
  'honour2est@gmail.com',
];

export const isAuthorizedAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
};

/**
 * Shared because both header states draw it: signed in it opens the account
 * menu, signed out it is a link to sign in. No "use client" here on purpose,
 * so the Server Component header can render it without a client boundary.
 */
export function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3.5 17c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

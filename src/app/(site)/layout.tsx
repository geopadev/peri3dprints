import { SiteHeader } from "@/components/shop/site-header";

/**
 * Route group for every buyer facing page: browsing, auth, account. Kept
 * separate from /admin, which has its own nav in its own shell layout, so the
 * two never stack on top of each other.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}

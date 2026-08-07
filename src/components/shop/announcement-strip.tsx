import { getSettings } from "@/lib/products";

/** Only renders when the owner has actually set something, per the brief. */
export async function AnnouncementStrip() {
  const { announcement } = await getSettings();
  if (!announcement) return null;

  // Ink, not flame: section 3 gives flame to the primary button and nothing
  // else, and this strip has no button to compete with anyway.
  return (
    <div className="border-b-2 border-ink bg-ink px-5 py-2 text-center">
      <p className="font-mono text-xs tracking-utility text-paper uppercase">{announcement}</p>
    </div>
  );
}

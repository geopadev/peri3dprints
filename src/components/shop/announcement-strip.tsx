import { getSettings } from "@/lib/products";

/** Only renders when the owner has actually set something, per the brief. */
export async function AnnouncementStrip() {
  const { announcement } = await getSettings();
  if (!announcement) return null;

  // Ink, not an accent. This bar sits above the fold on every page, so a hue
  // here would spend the section's accent before the page has started. The
  // masthead below it is the one loud block.
  return (
    <div className="border-b-2 border-ink bg-ink px-5 py-2 text-center">
      <p className="font-mono text-xs tracking-utility text-paper uppercase">{announcement}</p>
    </div>
  );
}

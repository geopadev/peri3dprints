import Link from "next/link";
import { Button } from "@/components/ui";
import { SectionBand } from "./section-band";

/**
 * Lime, because this is the invitation: yes, ask me. It is the highest
 * contrast accent in the palette at 12.54 against ink, so it carries a heading
 * and a paragraph comfortably.
 *
 * Still no second flourish competing with the spec strip: one colour, one
 * heading, one button. /custom itself is stage 12's build, so this links ahead
 * of it.
 *
 * The button is onAccent rather than primary. A flame button on lime would put
 * two loud accents in one section, and its ink fill also solves the focus ring:
 * paper on lime is 1.46 and would be invisible.
 */
export function CustomRequestBand() {
  return (
    <SectionBand tone="highlight" className="text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
        <h2 className="text-xl">Want something that is not on the shelf</h2>
        <p>Tell me what you have in mind and I will tell you if I can print it.</p>
        <Link href="/custom">
          <Button variant="onAccent">Ask for a custom print</Button>
        </Link>
      </div>
    </SectionBand>
  );
}

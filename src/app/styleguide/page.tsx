import type { Metadata } from "next";
import {
  Button,
  Card,
  EmptyState,
  Money,
  Skeleton,
  SpecStrip,
  Tag,
  UTILITY_TEXT,
} from "@/components/ui";
import { DialogDemo, FieldDemos, ToastDemo } from "./interactive-demos";

export const metadata: Metadata = {
  title: "Styleguide",
  // Keep this out of search results. It also needs excluding from the sitemap
  // once a sitemap exists.
  robots: { index: false, follow: false },
};

/** Applies the focus ring statically, so it can be seen without tabbing to it. */
const FOCUS_SHOWN = "outline-2 outline-offset-2 outline-cyan outline-solid";

const SWATCHES = [
  { name: "paper", hex: "#E7EAEE", className: "bg-paper" },
  { name: "surface", hex: "#FFFFFF", className: "bg-surface" },
  { name: "ink", hex: "#12151A", className: "bg-ink" },
  { name: "ink-soft", hex: "#5B6472", className: "bg-ink-soft" },
  { name: "flame", hex: "#FF5C1A", className: "bg-flame" },
  { name: "cyan", hex: "#00B8D9", className: "bg-cyan" },
  { name: "lime", hex: "#B8E62E", className: "bg-lime" },
  { name: "magenta", hex: "#FF3D8B", className: "bg-magenta" },
];

const TYPE_SCALE = [
  { px: 64, className: "text-4xl" },
  { px: 48, className: "text-3xl" },
  { px: 34, className: "text-2xl" },
  { px: 26, className: "text-xl" },
  { px: 20, className: "text-lg" },
  { px: 16, className: "text-base" },
  { px: 14, className: "text-sm" },
  { px: 12, className: "text-xs" },
];

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-t-2 border-ink pt-8">
      <div>
        <h2 className="text-2xl">{title}</h2>
        {note && <p className="mt-1 max-w-prose text-base text-ink">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-5 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl">Styleguide</h1>
        <p className="max-w-prose">
          Every base component and every state. If something here looks wrong, fix it here first,
          then in the pages that use it.
        </p>
        <SpecStrip
          material="PLA"
          dimensionsMm={[82, 40, 95]}
          weightGrams={46}
          printMinutes={260}
          note="Articulated"
        />
      </header>

      <Section
        title="Colour"
        note="One loud accent per screen. Flame is the primary button and nothing else."
      >
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SWATCHES.map((s) => (
            <li key={s.name} className="flex flex-col gap-2">
              <div className={`h-20 rounded-card border-2 border-ink ${s.className}`} />
              <div className={UTILITY_TEXT}>
                {s.name}
                <br />
                {s.hex}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Type"
        note="Display is Bricolage Grotesque, body is Hanken Grotesk, utility is DM Mono."
      >
        <div className="flex flex-col gap-3">
          {TYPE_SCALE.map((t) => (
            <div key={t.px} className="flex items-baseline gap-4">
              <span className="w-14 shrink-0 font-mono text-xs tracking-utility">{t.px}</span>
              <span className={`font-display ${t.className} truncate`}>Printed to order</span>
            </div>
          ))}
          <div className="mt-2 flex items-baseline gap-4">
            <span className="w-14 shrink-0 font-mono text-xs tracking-utility">mono</span>
            <span className="font-mono text-sm tracking-utility uppercase">
              Order 4417 · tracking BN9921004
            </span>
          </div>
        </div>
      </Section>

      <Section
        title="Buttons"
        note="Press shifts the shadow from 4px to 2px and moves the button into it."
      >
        <div className="flex flex-col gap-6">
          {(["primary", "secondary", "ghost", "danger"] as const).map((variant) => (
            <div key={variant} className="flex flex-col gap-3">
              <h3 className={UTILITY_TEXT}>{variant}</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant={variant} size="sm">
                  Small
                </Button>
                <Button variant={variant} size="md">
                  Medium
                </Button>
                <Button variant={variant} size="lg">
                  Large
                </Button>
                <Button variant={variant} disabled>
                  Disabled
                </Button>
                <Button variant={variant} className={FOCUS_SHOWN}>
                  Focus shown
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Form controls"
        note="Label, hint and error are wired with aria-describedby. Errors are ink, not magenta, so they stay readable."
      >
        <FieldDemos />
      </Section>

      <Section title="Focus and disabled on controls">
        <div className="grid gap-4 md:grid-cols-3">
          <input
            className={`h-12 w-full rounded-card border-2 border-ink bg-surface px-4 ${FOCUS_SHOWN}`}
            defaultValue="Focus shown"
            readOnly
          />
          <input
            className="h-12 w-full cursor-not-allowed rounded-card border-2 border-ink bg-surface px-4 opacity-50"
            defaultValue="Disabled"
            disabled
          />
          <input
            className="h-12 w-full rounded-card border-2 border-magenta bg-surface px-4"
            defaultValue="Invalid"
            readOnly
          />
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <h3 className="text-lg">Static card</h3>
            <p className="mt-2">Two pixel ink border, hard shadow, 14px radius.</p>
          </Card>
          <Card interactive>
            <h3 className="text-lg">Interactive card</h3>
            <p className="mt-2">Lifts 2px on hover over 120ms. Hover it.</p>
          </Card>
        </div>
      </Section>

      <Section title="Tags" note="No flame tag, because flame belongs to the primary button.">
        <div className="flex flex-wrap gap-3">
          <Tag>Neutral</Tag>
          <Tag tone="stock">In stock</Tag>
          <Tag tone="sale">Sale</Tag>
          <Tag tone="info">Made to order</Tag>
        </div>
      </Section>

      <Section
        title="Spec strip"
        note="The signature element. Only the fields that exist are rendered."
      >
        <div className="flex flex-col gap-4">
          <Card>
            <SpecStrip
              material="PLA"
              dimensionsMm={[82, 40, 95]}
              weightGrams={46}
              printMinutes={260}
              note="Articulated"
            />
          </Card>
          <Card>
            <SpecStrip material="PETG" weightGrams={120} printMinutes={45} />
          </Card>
          <Card>
            <SpecStrip dimensionsMm={[30, 30, 30]} printMinutes={60} />
          </Card>
          <Card>
            <SpecStrip material="Resin" />
          </Card>
          <Card>
            <p className="text-sm text-ink-soft">
              With no fields at all the strip renders nothing, and this line is what you see
              instead.
            </p>
            <SpecStrip />
          </Card>
        </div>
      </Section>

      <Section title="Money" note="Integer cents in, en-CY euro formatting out.">
        <div className="flex flex-wrap items-center gap-6">
          <Money cents={0} />
          <Money cents={1250} />
          <Money cents={99900} />
          <Money cents={-500} />
          <Money cents={1250} mono={false} />
        </div>
      </Section>

      <Section
        title="Dialog"
        note="Radix handles the focus trap. Centred without a transform so reduced motion cannot break it."
      >
        <DialogDemo />
      </Section>

      <Section title="Toast">
        <ToastDemo />
      </Section>

      <Section title="Empty state">
        <EmptyState
          title="Nothing here yet"
          description="Message me and I'll print what you want."
          action={<Button>Message me</Button>}
        />
      </Section>

      <Section title="Skeleton">
        <Card>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </Card>
      </Section>
    </main>
  );
}

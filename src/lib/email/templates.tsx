import { Body, Container, Head, Html, Link, Preview, Text } from "@react-email/components";

/**
 * Plain and short, written to CLAUDE.md section 4. No em dashes, no marketing.
 * One shared frame so every email reads the same and renders as plain text.
 */
const body = {
  fontFamily: "system-ui, sans-serif",
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#12151a",
};
const frame = { padding: "24px", maxWidth: "560px" };

function Frame({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={frame}>{children}</Container>
      </Body>
    </Html>
  );
}

const euro = (cents: number) =>
  new Intl.NumberFormat("en-CY", { style: "currency", currency: "EUR" }).format(cents / 100);

export function OrderConfirmedEmail(p: {
  name: string;
  orderNumber: string;
  orderUrl: string;
  totalCents: number;
}) {
  return (
    <Frame preview={`Order ${p.orderNumber} received`}>
      <Text>Hi {p.name},</Text>
      <Text>
        Got your order, number {p.orderNumber}, for {euro(p.totalCents)}.
      </Text>
      <Text>
        Nothing to pay yet. I will check it and send you a payment link in our conversation on the
        site. We sort out posting or collecting there too.
      </Text>
      <Text>
        Your order page: <Link href={p.orderUrl}>{p.orderUrl}</Link>
      </Text>
      <Text>That link opens the order without signing in, so keep it to yourself.</Text>
      <Text>Peri</Text>
    </Frame>
  );
}

export function OrderShippedEmail(p: {
  name: string;
  orderNumber: string;
  orderUrl: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
}) {
  return (
    <Frame preview={`Order ${p.orderNumber} is on its way`}>
      <Text>Hi {p.name},</Text>
      <Text>Order {p.orderNumber} is posted.</Text>
      {p.trackingNumber && (
        <Text>
          Tracking:{" "}
          {p.trackingUrl ? <Link href={p.trackingUrl}>{p.trackingNumber}</Link> : p.trackingNumber}
        </Text>
      )}
      <Text>
        Order page: <Link href={p.orderUrl}>{p.orderUrl}</Link>
      </Text>
      <Text>Message me on the site if anything is wrong when it arrives.</Text>
      <Text>Peri</Text>
    </Frame>
  );
}

export function OwnerNewOrderEmail(p: {
  name: string;
  orderNumber: string;
  totalCents: number;
  adminUrl: string;
}) {
  return (
    <Frame preview={`New order ${p.orderNumber}`}>
      <Text>
        New order {p.orderNumber} from {p.name}, {euro(p.totalCents)}.
      </Text>
      <Text>
        Open it: <Link href={p.adminUrl}>{p.adminUrl}</Link>
      </Text>
    </Frame>
  );
}

export function OwnerNewMessageEmail(p: { from: string; preview: string; adminUrl: string }) {
  return (
    <Frame preview={`New message from ${p.from}`}>
      <Text>{p.from} wrote:</Text>
      <Text>{p.preview}</Text>
      <Text>
        Reply: <Link href={p.adminUrl}>{p.adminUrl}</Link>
      </Text>
    </Frame>
  );
}

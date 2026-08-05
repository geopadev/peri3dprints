import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peri 3D Prints",
  description: "3D printed toys and objects, made to order in Cyprus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

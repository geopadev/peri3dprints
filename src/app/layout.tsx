import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage-src",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-src",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-mono-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Peri 3D Prints",
    template: "%s | Peri 3D Prints",
  },
  description: "3D printed toys and objects, made to order in Cyprus.",
  applicationName: "Peri 3D Prints",
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "Peri 3D Prints",
    title: "Peri 3D Prints",
    description: "3D printed toys and objects, made to order in Cyprus.",
    locale: "en_CY",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${hanken.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

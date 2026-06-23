import type { Metadata } from "next";
import { Archivo, Space_Grotesk, Press_Start_2P } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const pressStart2P = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Isnad Bin Omar — Designer",
  description:
    "Designer working across product, brand, and interactive — selected work, 2022–2026.",
  openGraph: {
    title: "Isnad Bin Omar — Designer",
    description:
      "Designer working across product, brand, and interactive — selected work, 2022–2026.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${spaceGrotesk.variable} ${pressStart2P.variable}`}
    >
      <body className="min-h-screen bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}

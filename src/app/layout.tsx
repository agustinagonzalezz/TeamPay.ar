import type { Metadata } from "next";
import { Geist_Mono, Syne, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuente principal — geométrica, editorial, distintiva
const syne = Syne({
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

// Fuente display para el hero del equipo
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeamPay.ar",
  description: "Gestioná los pagos de tu equipo de fútbol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${syne.variable} ${geistMono.variable} ${barlowCondensed.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Austro",
    template: "%s | Austro",
  },
  description:
    "Encuentra comercios, servicios y eventos en Coronel Oviedo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
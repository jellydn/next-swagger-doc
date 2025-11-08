import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js 14 Auto-Generate Example",
  description:
    "Demonstrating next-swagger-doc auto-generation feature with Next.js 14",
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

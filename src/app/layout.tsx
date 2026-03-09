import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vensim AI — System Dynamics Model Generator",
  description:
    "Transform natural language descriptions into complete Vensim .mdl simulation models using AI. Inspired by the DAVID© methodology.",
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

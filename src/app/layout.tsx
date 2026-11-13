import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMB - Lets Make Brand | Partner & Brand Promotion Platform",
  description:
    "Enterprise Partner & Brand Promotion Platform connecting verified brands, vendors, and high-performance partner networks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}

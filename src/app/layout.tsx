import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phu Gia Bao Loc - ERA Vietnam",
  description: "Phu Gia Bao Loc interactive project experience.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}

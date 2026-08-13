import type { Metadata } from "next";
import "./globals.css";
import { PgblBottomNav } from "@/components/layout/PgblBottomNav";

export const metadata: Metadata = {
  title: "Phu Gia Bao Loc - ERA Vietnam",
  description: "Frontend demo for Phu Gia Bao Loc interactive project experience.",
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
    <html lang="vi">
      <body>
        {children}
        <PgblBottomNav />
      </body>
    </html>
  );
}

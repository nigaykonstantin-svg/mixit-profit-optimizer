import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIXIT Manager",
  description: "Панель управления маркетплейсом MIXIT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

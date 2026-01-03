import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Days - Sugar-Free Streaks",
  description: "Track your sugar-free streaks and compete with friends",
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

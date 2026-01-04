import type { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import "./globals.css";

const NavigationProgressBar = dynamic(
  () => import("@/components/NavigationProgressBar").then((mod) => mod.NavigationProgressBar),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Better Habits - Habit Challenge Tracker",
  description: "Track daily habits through challenges with friends. Stay accountable with streaks and leaderboards.",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  manifest: '/site.webmanifest'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

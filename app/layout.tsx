import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Type Game · Arkiv",
  description:
    "Chat with a computer for four minutes. Find out which data type you are. The chat expires. Your type doesn't.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

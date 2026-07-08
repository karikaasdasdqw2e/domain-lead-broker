import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domain Lead Broker",
  description: "Research domain end-user leads and create Gmail drafts for domain outbound sales."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

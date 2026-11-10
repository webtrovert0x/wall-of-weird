import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Web3Provider } from "@/components/Web3Provider";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BOT Wall of Weird — On-Chain Collaborative Pixel Wall",
  description:
    "100 tiles. Unlimited creativity. One shared wall permanently on BOT Chain Testnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const reownId = process.env.REOWN_ID?.trim() ?? "";

  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Web3Provider reownId={reownId}>{children}</Web3Provider>
      </body>
    </html>
  );
}


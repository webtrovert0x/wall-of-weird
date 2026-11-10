"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { BOT_CHAIN_ID, BOT_EXPLORER_URL } from "@/lib/chain";
import { shortenAddress } from "@/lib/types";
import { useWalletModal } from "./Web3Provider";

export function Header() {
  const { address, isConnected, chainId } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { hasReownId, openWalletModal } = useWalletModal();
  const [walletError, setWalletError] = useState<string | null>(null);

  const isCorrectChain = isConnected && chainId === BOT_CHAIN_ID;

  async function handleConnect() {
    setWalletError(null);
    try {
      if (hasReownId) {
        await openWalletModal();
        return;
      }
      const injectedConnector = connectors[0];
      if (!injectedConnector) {
        setWalletError("Add REOWN_ID to .env or install a browser wallet extension.");
        return;
      }
      await connectAsync({ connector: injectedConnector, chainId: BOT_CHAIN_ID });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to connect wallet.";
      if (!msg.toLowerCase().includes("rejected")) {
        setWalletError(msg);
      }
    }
  }

  async function handleSwitchNetwork() {
    setWalletError(null);
    try {
      await switchChainAsync({ chainId: BOT_CHAIN_ID });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to switch to BOT Chain Testnet.";
      setWalletError(msg);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-[#08090f]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="grid h-9 w-9 grid-cols-3 gap-0.5 rounded-md border border-slate-700 bg-[#0f121b] p-1"
            aria-hidden="true"
          >
            <span className="bg-cyan-400" />
            <span className="bg-violet-500" />
            <span className="bg-emerald-400" />
            <span className="bg-fuchsia-500" />
            <span className="bg-slate-900" />
            <span className="bg-amber-400" />
            <span className="bg-emerald-400" />
            <span className="bg-cyan-400" />
            <span className="bg-rose-500" />
          </div>
          <div>
            <span className="block text-base font-bold tracking-tight text-white sm:text-lg">
              BOT Wall of Weird
            </span>
            <span className="block text-[11px] font-mono-pixel text-slate-400">
              On-Chain 10×10 Pixel Wall
            </span>
          </div>
        </div>

        {/* Network indicator, Explorer, Wallet */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className={[
              "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-mono-pixel",
              isConnected && !isCorrectChain
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
            ].join(" ")}
          >
            <span
              className={[
                "h-2 w-2 rounded-full",
                isConnected && !isCorrectChain ? "bg-amber-400" : "bg-emerald-400",
              ].join(" ")}
            />
            <span>
              {isConnected && !isCorrectChain
                ? `Wrong Chain (${chainId ?? "?"}) • Need 968`
                : "BOT Chain Testnet (968)"}
            </span>
          </div>

          <a
            href={BOT_EXPLORER_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-[#0f121b] px-3 py-1.5 text-xs font-mono-pixel text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-300"
          >
            Explorer ↗
          </a>

          {isConnected && address ? (
            <div className="flex items-center gap-2">
              {!isCorrectChain ? (
                <button
                  type="button"
                  onClick={handleSwitchNetwork}
                  disabled={isSwitching}
                  className="cursor-pointer rounded-md border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 text-xs font-mono-pixel font-semibold text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-50"
                >
                  {isSwitching ? "Switching..." : "Switch to 968"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => (hasReownId ? openWalletModal() : disconnect())}
                title={hasReownId ? "Manage wallet" : "Disconnect wallet"}
                className="cursor-pointer rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-mono-pixel font-semibold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20"
              >
                {shortenAddress(address)}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              className="cursor-pointer rounded-md bg-gradient-to-r from-violet-600 to-cyan-500 px-3.5 py-1.5 text-xs font-mono-pixel font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {walletError ? (
        <div className="border-t border-rose-500/30 bg-rose-950/50 px-4 py-2 text-center text-xs text-rose-200">
          {walletError}
        </div>
      ) : null}
    </header>
  );
}


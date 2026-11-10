"use client";

import { getExplorerAddressUrl, getExplorerTxUrl } from "@/lib/chain";
import {
  formatTimestamp,
  shortenAddress,
  type ClaimActivityItem,
} from "@/lib/types";

interface ActivityFeedProps {
  activities: ClaimActivityItem[];
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
}

export function ActivityFeed({
  activities,
  isLoading,
  isConfigured,
  error,
}: ActivityFeedProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <div className="rounded-xl border border-slate-800/90 bg-[#0f121b] p-5 sm:p-6 pixel-shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-white">Live On-Chain Activity Feed</h2>
            <p className="text-xs text-slate-400">
              Populated directly from <code className="font-mono-pixel text-cyan-300">TileClaimed</code>{" "}
              event logs on BOT Chain Testnet.
            </p>
          </div>
          <span className="rounded border border-slate-800 bg-[#090b12] px-2.5 py-1 text-xs font-mono-pixel text-slate-300">
            {activities.length} {activities.length === 1 ? "claim" : "claims"}
          </span>
        </div>

        {!isConfigured ? (
          <div className="rounded-lg border border-dashed border-slate-800 bg-[#090b12] p-6 text-center text-sm text-slate-400">
            Deploy the contract and set <code className="font-mono-pixel text-slate-200">CONTRACT_ADDRESS</code>{" "}
            in <code className="font-mono-pixel text-slate-200">.env</code> to stream live claim events.
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            Failed to load contract event logs: {error}
          </div>
        ) : isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }, (_, idx) => (
              <div
                key={idx}
                className="h-16 animate-pulse rounded-lg border border-slate-800 bg-slate-900/60"
              />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 bg-[#090b12] p-6 text-center text-sm text-slate-400">
            No tiles have been claimed on-chain yet. Be the first to claim a pixel!
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.map((item) => (
              <div
                key={`${item.tileId}-${item.txHash ?? item.timestamp}`}
                className="flex flex-col gap-3 rounded-lg border border-slate-800/90 bg-[#090b12] p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 h-9 w-9 shrink-0 rounded-md border border-white/20"
                    style={{ backgroundColor: item.hexColor }}
                    title={item.hexColor}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono-pixel font-semibold text-cyan-300">
                        Tile #{item.tileId}
                      </span>
                      <span className="text-slate-500">claimed by</span>
                      <a
                        href={getExplorerAddressUrl(item.owner)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono-pixel text-slate-200 hover:text-cyan-300 underline decoration-slate-700"
                      >
                        {shortenAddress(item.owner)}
                      </a>
                      <span className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[11px] font-mono-pixel text-slate-300">
                        {item.hexColor}
                      </span>
                    </div>

                    {item.message ? (
                      <p className="mt-1 text-sm text-slate-300 break-words">
                        &ldquo;{item.message}&rdquo;
                      </p>
                    ) : (
                      <p className="mt-1 text-xs italic text-slate-500">No message</p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs font-mono-pixel text-slate-400 sm:flex-col sm:items-end sm:gap-1">
                  <span>{formatTimestamp(item.timestamp)}</span>
                  {item.txHash ? (
                    <a
                      href={getExplorerTxUrl(item.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/40"
                    >
                      View Tx ({shortenAddress(item.txHash)}) ↗
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


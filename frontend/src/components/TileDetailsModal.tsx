"use client";

import { getExplorerAddressUrl, getExplorerTxUrl } from "@/lib/chain";
import { formatTimestamp, shortenAddress, type TileData } from "@/lib/types";

interface TileDetailsModalProps {
  tile: TileData | null;
  onClose: () => void;
}

export function TileDetailsModal({ tile, onClose }: TileDetailsModalProps) {
  if (!tile) return null;

  const row = Math.floor(tile.id / 10);
  const col = tile.id % 10;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Tile #${tile.id} details`}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-700 bg-[#0f121b] p-6 pixel-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 shrink-0 rounded-md border border-white/20 shadow-inner"
              style={{ backgroundColor: tile.hexColor }}
            />
            <div>
              <h3 className="text-lg font-bold text-white font-mono-pixel">
                Tile #{tile.id}
              </h3>
              <p className="text-xs font-mono-pixel text-slate-400">
                Row {row}, Column {col} • Permanently Claimed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-700 px-2.5 py-1 text-xs font-mono-pixel text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer"
          >
            ESC / Close
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <div className="rounded-lg border border-slate-800 bg-[#090b12] p-3">
            <span className="block text-[11px] font-mono-pixel uppercase text-slate-400">
              Owner Wallet
            </span>
            <a
              href={getExplorerAddressUrl(tile.owner)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 font-mono-pixel text-cyan-400 hover:text-cyan-300 break-all"
            >
              {tile.owner}
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800 bg-[#090b12] p-3">
              <span className="block text-[11px] font-mono-pixel uppercase text-slate-400">
                Stored RGB Colour
              </span>
              <div className="mt-1 flex items-center gap-2 font-mono-pixel text-white">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-xs border border-white/20"
                  style={{ backgroundColor: tile.hexColor }}
                />
                {tile.hexColor}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#090b12] p-3">
              <span className="block text-[11px] font-mono-pixel uppercase text-slate-400">
                Claimed At
              </span>
              <p className="mt-1 text-xs font-mono-pixel text-slate-200">
                {formatTimestamp(tile.claimedAt)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#090b12] p-3">
            <span className="block text-[11px] font-mono-pixel uppercase text-slate-400">
              On-Chain Message
            </span>
            <p className="mt-1 text-sm text-slate-100 break-words">
              {tile.message ? (
                <>&ldquo;{tile.message}&rdquo;</>
              ) : (
                <span className="italic text-slate-500">No message attached</span>
              )}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#090b12] p-3">
            <span className="block text-[11px] font-mono-pixel uppercase text-slate-400">
              Original Claim Transaction
            </span>
            {tile.txHash ? (
              <a
                href={getExplorerTxUrl(tile.txHash)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 font-mono-pixel text-xs text-emerald-400 hover:text-emerald-300 break-all"
              >
                {shortenAddress(tile.txHash)} ({tile.txHash}) ↗
              </a>
            ) : (
              <p className="mt-1 text-xs text-slate-500 font-mono-pixel">
                Transaction hash unavailable from current RPC log window. Check{" "}
                <a
                  href={getExplorerAddressUrl(tile.owner)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 underline"
                >
                  owner on BOTScan
                </a>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


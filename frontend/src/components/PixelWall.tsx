"use client";

import { useState } from "react";
import { shortenAddress, type TileData } from "@/lib/types";

interface PixelWallProps {
  tiles: TileData[];
  selectedTileId: number | null;
  onSelectEmptyTile: (tileId: number) => void;
  onSelectClaimedTile: (tile: TileData) => void;
  isLoading: boolean;
  isConfigured: boolean;
}

export function PixelWall({
  tiles,
  selectedTileId,
  onSelectEmptyTile,
  onSelectClaimedTile,
  isLoading,
  isConfigured,
}: PixelWallProps) {
  const [hoveredTile, setHoveredTile] = useState<TileData | null>(null);

  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0f121b] p-4 sm:p-6 pixel-shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">The 10 × 10 Pixel Wall</h2>
          <p className="text-xs text-slate-400">
            Click a dark tile to claim it, or click a coloured tile to inspect its on-chain record.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-pixel text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs border border-slate-700 bg-[#131724]" />
            Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs border border-cyan-400 bg-cyan-500/30" />
            Selected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-gradient-to-br from-fuchsia-500 to-cyan-400" />
            Claimed
          </span>
        </div>
      </div>

      {/* Live hover readout */}
      <div className="mb-3 flex min-h-8 items-center justify-between rounded-md border border-slate-800/80 bg-[#090b12] px-3 py-1.5 text-xs font-mono-pixel">
        {hoveredTile ? (
          hoveredTile.claimed ? (
            <div className="flex flex-wrap items-center gap-2 text-slate-200">
              <span
                className="inline-block h-3 w-3 rounded-xs border border-white/20"
                style={{ backgroundColor: hoveredTile.hexColor }}
              />
              <span className="text-cyan-300">Tile #{hoveredTile.id}</span>
              <span className="text-slate-500">•</span>
              <span>Owner: {shortenAddress(hoveredTile.owner)}</span>
              {hoveredTile.message ? (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="truncate max-w-[260px] text-slate-300">
                    &ldquo;{hoveredTile.message}&rdquo;
                  </span>
                </>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-emerald-400">Tile #{hoveredTile.id}</span>
              <span className="text-slate-500">•</span>
              <span>Available to claim (gas only)</span>
            </div>
          )
        ) : (
          <span className="text-slate-500">Hover any tile to inspect its ID and owner...</span>
        )}
      </div>

      {isLoading && isConfigured ? (
        <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
          {Array.from({ length: 100 }, (_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-xs border border-slate-800 bg-slate-900/70"
            />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-10 gap-1 sm:gap-1.5"
          role="grid"
          aria-label="BOT Wall of Weird 10 by 10 pixel grid"
        >
          {tiles.map((tile) => {
            const isSelected = !tile.claimed && selectedTileId === tile.id;

            return (
              <button
                key={tile.id}
                type="button"
                disabled={!isConfigured}
                onMouseEnter={() => setHoveredTile(tile)}
                onMouseLeave={() => setHoveredTile(null)}
                onFocus={() => setHoveredTile(tile)}
                onClick={() => {
                  if (!isConfigured) return;
                  if (tile.claimed) {
                    onSelectClaimedTile(tile);
                  } else {
                    onSelectEmptyTile(tile.id);
                  }
                }}
                title={
                  tile.claimed
                    ? `Tile #${tile.id} • Owner: ${tile.owner}`
                    : `Tile #${tile.id} • Available`
                }
                style={
                  tile.claimed
                    ? { backgroundColor: tile.hexColor }
                    : undefined
                }
                className={[
                  "group relative aspect-square w-full rounded-xs transition-all duration-150 focus:outline-none",
                  !isConfigured ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                  tile.claimed
                    ? "border border-white/15 hover:z-10 hover:scale-110 hover:border-white hover:shadow-lg"
                    : isSelected
                      ? "border-2 border-cyan-400 bg-cyan-950/50 shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                      : "border border-slate-800/90 bg-[#131724] hover:border-cyan-400/70 hover:bg-[#1a2033]",
                ].join(" ")}
              >
                {!tile.claimed && (
                  <span
                    className={[
                      "font-mono-pixel text-[9px] sm:text-[10px] select-none",
                      isSelected ? "text-cyan-300 font-bold" : "text-slate-600 group-hover:text-slate-300",
                    ].join(" ")}
                  >
                    {tile.id}
                  </span>
                )}

                {tile.claimed && (
                  <span className="pointer-events-none absolute -top-9 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded border border-slate-700 bg-slate-950/95 px-2 py-1 text-[10px] font-mono-pixel text-white shadow-xl group-hover:block">
                    #{tile.id} • {shortenAddress(tile.owner)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


"use client";

import type { WallStats } from "@/lib/types";

interface HeroStatsProps {
  stats: WallStats;
  isLoading: boolean;
  isConfigured: boolean;
}

export function HeroStats({ stats, isLoading, isConfigured }: HeroStatsProps) {
  const cards = [
    {
      label: "Total Claimed Tiles",
      value: isConfigured ? `${stats.totalClaimed} / 100` : "— / 100",
      accent: "text-cyan-400",
    },
    {
      label: "Remaining Tiles",
      value: isConfigured ? `${stats.remainingTiles}` : "—",
      accent: "text-emerald-400",
    },
    {
      label: "Unique Contributors",
      value: isConfigured ? `${stats.uniqueContributors}` : "—",
      accent: "text-violet-400",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 pb-6 sm:px-6">
      <div className="rounded-xl border border-slate-800/90 bg-[#0f121b]/90 p-6 sm:p-8 pixel-shadow">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-mono-pixel text-violet-300">
            <span className="h-2 w-2 bg-violet-400" />
            10 × 10 ON-CHAIN PIXEL CANVAS • GAS FEE ONLY
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            A little piece of weirdness, permanently on-chain.
          </h1>
          <p className="mt-3 text-base text-slate-300 sm:text-lg">
            100 tiles. Unlimited creativity. One shared wall.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-slate-800 bg-[#090b12] px-4 py-3.5"
            >
              <p className="text-xs font-mono-pixel uppercase tracking-wider text-slate-400">
                {card.label}
              </p>
              <p className={`mt-1.5 text-2xl font-bold font-mono-pixel ${card.accent}`}>
                {isLoading && isConfigured ? (
                  <span className="inline-block h-7 w-20 animate-pulse rounded bg-slate-800" />
                ) : (
                  card.value
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


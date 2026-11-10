"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";
import { BOT_CHAIN_ID } from "@/lib/chain";
import {
  BOT_WALL_OF_WEIRD_ABI,
  parseValidContractAddress,
} from "@/lib/contract";
import {
  uint24ToHex,
  type ClaimActivityItem,
  type TileData,
  type WallStats,
} from "@/lib/types";
import { ActivityFeed } from "./ActivityFeed";
import { ClaimPanel } from "./ClaimPanel";
import { Header } from "./Header";
import { HeroStats } from "./HeroStats";
import { PixelWall } from "./PixelWall";
import { TileDetailsModal } from "./TileDetailsModal";

const TILE_CLAIMED_EVENT = parseAbiItem(
  "event TileClaimed(uint8 indexed tileId, address indexed owner, uint24 color, string message, uint256 timestamp)"
);

const EMPTY_TILES: TileData[] = Array.from({ length: 100 }, (_, id) => ({
  id,
  owner: "0x0000000000000000000000000000000000000000",
  color: 0,
  hexColor: "#131724",
  claimed: false,
  claimedAt: 0,
  message: "",
}));

interface WallDashboardProps {
  rawContractAddress: string;
  deployBlock: number;
  hasReownId: boolean;
}

export function WallDashboard({
  rawContractAddress,
  deployBlock,
  hasReownId,
}: WallDashboardProps) {
  const contractAddress = useMemo(
    () => parseValidContractAddress(rawContractAddress),
    [rawContractAddress]
  );
  const publicClient = usePublicClient({ chainId: BOT_CHAIN_ID });

  const [tiles, setTiles] = useState<TileData[]>(EMPTY_TILES);
  const [stats, setStats] = useState<WallStats>({
    totalClaimed: 0,
    remainingTiles: 100,
    uniqueContributors: 0,
  });
  const [activities, setActivities] = useState<ClaimActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(contractAddress));
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [logError, setLogError] = useState<string | null>(null);

  const [selectedEmptyTileId, setSelectedEmptyTileId] = useState<number | null>(null);
  const [inspectedTile, setInspectedTile] = useState<TileData | null>(null);

  const isConfigured = Boolean(contractAddress);

  const fetchContractData = useCallback(async () => {
    if (!contractAddress || !publicClient) {
      setIsLoading(false);
      setIsDeployed(false);
      return;
    }

    setLoadError(null);
    setLogError(null);

    try {
      const bytecode = await publicClient.getBytecode({ address: contractAddress });
      if (!bytecode || bytecode === "0x") {
        setIsDeployed(false);
        setTiles(EMPTY_TILES);
        setActivities([]);
        setIsLoading(false);
        return;
      }

      setIsDeployed(true);

      const [rawWall, rawStats, rawRecentClaims] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: BOT_WALL_OF_WEIRD_ABI,
          functionName: "getWall",
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: BOT_WALL_OF_WEIRD_ABI,
          functionName: "getStats",
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: BOT_WALL_OF_WEIRD_ABI,
          functionName: "getRecentClaims",
        }),
      ]);

      const txHashByTile = new Map<number, `0x${string}`>();
      let eventActivities: ClaimActivityItem[] = [];

      try {
        const fromBlock = deployBlock > 0 ? BigInt(deployBlock) : 0n;
        let logs;
        try {
          logs = await publicClient.getLogs({
            address: contractAddress,
            event: TILE_CLAIMED_EVENT,
            fromBlock,
            toBlock: "latest",
          });
        } catch {
          // Some RPCs cap eth_getLogs block range; retry over recent 20,000 blocks.
          const latestBlock = await publicClient.getBlockNumber();
          const fallbackFrom = latestBlock > 20_000n ? latestBlock - 20_000n : 0n;
          logs = await publicClient.getLogs({
            address: contractAddress,
            event: TILE_CLAIMED_EVENT,
            fromBlock: fallbackFrom,
            toBlock: "latest",
          });
        }

        for (const log of logs) {
          const tileId = Number(log.args.tileId ?? 0);
          if (log.transactionHash) {
            txHashByTile.set(tileId, log.transactionHash);
          }
        }

        eventActivities = [...logs]
          .reverse()
          .map((log) => {
            const tileId = Number(log.args.tileId ?? 0);
            const color = Number(log.args.color ?? 0);
            return {
              tileId,
              owner: (log.args.owner ??
                "0x0000000000000000000000000000000000000000") as `0x${string}`,
              color,
              hexColor: uint24ToHex(color),
              message: log.args.message ?? "",
              timestamp: Number(log.args.timestamp ?? 0n),
              txHash: log.transactionHash,
              blockNumber: log.blockNumber,
            };
          });
      } catch (err) {
        setLogError(
          err instanceof Error
            ? err.message
            : "Could not load event logs from RPC."
        );
      }

      interface RawContractTile {
        owner: `0x${string}`;
        color: number;
        claimed: boolean;
        claimedAt: bigint;
        message: string;
      }

      const typedWall = rawWall as readonly RawContractTile[];

      const mappedTiles: TileData[] = typedWall.map((tile, idx) => {
        const colorNum = Number(tile.color);
        return {
          id: idx,
          owner: tile.owner,
          color: colorNum,
          hexColor: tile.claimed ? uint24ToHex(colorNum) : "#131724",
          claimed: tile.claimed,
          claimedAt: Number(tile.claimedAt),
          message: tile.message,
          txHash: txHashByTile.get(idx),
        };
      });

      setTiles(mappedTiles);
      setStats({
        totalClaimed: Number(rawStats[0]),
        remainingTiles: Number(rawStats[1]),
        uniqueContributors: Number(rawStats[2]),
      });

      if (eventActivities.length > 0) {
        setActivities(eventActivities);
      } else {
        setActivities(
          rawRecentClaims.map((rc) => {
            const colorNum = Number(rc.color);
            return {
              tileId: Number(rc.tileId),
              owner: rc.owner,
              color: colorNum,
              hexColor: uint24ToHex(colorNum),
              message: rc.message,
              timestamp: Number(rc.claimedAt),
              txHash: txHashByTile.get(Number(rc.tileId)),
            };
          })
        );
      }

      // Clear empty selection if that tile was claimed while user was viewing
      setSelectedEmptyTileId((prev) =>
        prev !== null && mappedTiles[prev]?.claimed ? null : prev
      );
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to fetch wall data from BOT Chain Testnet RPC."
      );
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, deployBlock, publicClient]);

  useEffect(() => {
    void fetchContractData();
  }, [fetchContractData]);

  useEffect(() => {
    if (!inspectedTile) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setInspectedTile(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inspectedTile]);

  const selectedTile =
    selectedEmptyTileId !== null ? tiles[selectedEmptyTileId] ?? null : null;

  return (
    <div className="min-h-screen pixel-grid-bg">
      <Header />

      <main>
        <HeroStats
          stats={stats}
          isLoading={isLoading}
          isConfigured={isConfigured && isDeployed}
        />

        {/* Configuration / Deployment Notice */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          {!isConfigured ? (
            <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-100">
              <p className="font-mono-pixel font-semibold text-amber-300">
                Contract Not Configured Yet
              </p>
              <p className="mt-1.5 text-slate-200">
                Deploy <code className="font-mono-pixel text-cyan-300">BOTWallOfWeird.sol</code> to
                BOT Chain Testnet (Chain ID <code className="font-mono-pixel">968</code>) and add{" "}
                <code className="font-mono-pixel text-cyan-300">CONTRACT_ADDRESS=0x...</code> to your{" "}
                <code className="font-mono-pixel">.env</code> file, then reload this page.
              </p>
            </div>
          ) : !isLoading && !isDeployed && !loadError ? (
            <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-100">
              <p className="font-mono-pixel font-semibold text-amber-300">
                No Contract Bytecode Found on BOT Chain Testnet (968)
              </p>
              <p className="mt-1.5 text-slate-200">
                Address <code className="font-mono-pixel">{contractAddress}</code> does not currently
                contain deployed contract code on <code className="font-mono-pixel">https://rpc.bohr.life</code>.
                Verify your deployment transaction and <code className="font-mono-pixel">CONTRACT_ADDRESS</code>.
              </p>
            </div>
          ) : null}

          {!hasReownId && (
            <div className="mb-6 rounded-xl border border-slate-700 bg-[#0f121b] px-4 py-3 text-xs text-slate-300">
              <span className="font-mono-pixel text-cyan-300">REOWN_ID</span> is currently empty in{" "}
              <code className="font-mono-pixel">.env</code>. Add your Reown Project ID to enable the full
              Reown AppKit wallet modal (browser-injected wallets still work as fallback).
            </div>
          )}

          {loadError && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              <span>RPC Error: {loadError}</span>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  void fetchContractData();
                }}
                className="cursor-pointer rounded border border-rose-400/50 px-3 py-1 text-xs font-mono-pixel text-rose-100 hover:bg-rose-500/20"
              >
                Retry
              </button>
            </div>
          )}
        </section>

        {/* Main Grid + Claim Panel */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <PixelWall
              tiles={tiles}
              selectedTileId={selectedEmptyTileId}
              onSelectEmptyTile={(tileId) => setSelectedEmptyTileId(tileId)}
              onSelectClaimedTile={(tile) => setInspectedTile(tile)}
              isLoading={isLoading}
              isConfigured={isConfigured && isDeployed}
            />
          </div>

          <div className="lg:col-span-5">
            <ClaimPanel
              contractAddress={contractAddress}
              isConfigured={isConfigured}
              isDeployed={isDeployed}
              selectedTile={selectedTile}
              onClaimConfirmed={fetchContractData}
              onClearSelection={() => setSelectedEmptyTileId(null)}
            />
          </div>
        </section>

        <ActivityFeed
          activities={activities}
          isLoading={isLoading}
          isConfigured={isConfigured && isDeployed}
          error={logError}
        />
      </main>

      <TileDetailsModal
        tile={inspectedTile}
        onClose={() => setInspectedTile(null)}
      />
    </div>
  );
}

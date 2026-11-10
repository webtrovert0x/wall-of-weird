export interface TileData {
  id: number;
  owner: `0x${string}`;
  color: number;
  hexColor: string;
  claimed: boolean;
  claimedAt: number;
  message: string;
  txHash?: `0x${string}`;
}

export interface WallStats {
  totalClaimed: number;
  remainingTiles: number;
  uniqueContributors: number;
}

export interface ClaimActivityItem {
  tileId: number;
  owner: `0x${string}`;
  color: number;
  hexColor: string;
  message: string;
  timestamp: number;
  txHash?: `0x${string}`;
  blockNumber?: bigint;
}

export function uint24ToHex(color: number): string {
  const clamped = Math.max(0, Math.min(0xffffff, Math.floor(color)));
  return `#${clamped.toString(16).padStart(6, "0").toUpperCase()}`;
}

export function hexToUint24(hex: string): number | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value) || value < 0 || value > 0xffffff) {
    return null;
  }
  return value;
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(unixSeconds: number): string {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


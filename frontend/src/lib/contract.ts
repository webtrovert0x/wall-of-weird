import { isAddress } from "viem";

export const BOT_WALL_OF_WEIRD_ABI = [
  {
    type: "function",
    name: "WALL_SIZE",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_MESSAGE_LENGTH",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_COLOR",
    inputs: [],
    outputs: [{ name: "", type: "uint24", internalType: "uint24" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimTile",
    inputs: [
      { name: "tileId", type: "uint8", internalType: "uint8" },
      { name: "color", type: "uint24", internalType: "uint24" },
      { name: "message", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getTile",
    inputs: [{ name: "tileId", type: "uint8", internalType: "uint8" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct BOTWallOfWeird.Tile",
        components: [
          { name: "owner", type: "address", internalType: "address" },
          { name: "color", type: "uint24", internalType: "uint24" },
          { name: "claimed", type: "bool", internalType: "bool" },
          { name: "claimedAt", type: "uint64", internalType: "uint64" },
          { name: "message", type: "string", internalType: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWall",
    inputs: [],
    outputs: [
      {
        name: "wall",
        type: "tuple[100]",
        internalType: "struct BOTWallOfWeird.Tile[100]",
        components: [
          { name: "owner", type: "address", internalType: "address" },
          { name: "color", type: "uint24", internalType: "uint24" },
          { name: "claimed", type: "bool", internalType: "bool" },
          { name: "claimedAt", type: "uint64", internalType: "uint64" },
          { name: "message", type: "string", internalType: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStats",
    inputs: [],
    outputs: [
      { name: "claimedCount", type: "uint256", internalType: "uint256" },
      { name: "remainingCount", type: "uint256", internalType: "uint256" },
      { name: "contributorCount", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecentClaims",
    inputs: [],
    outputs: [
      {
        name: "recent",
        type: "tuple[]",
        internalType: "struct BOTWallOfWeird.RecentClaim[]",
        components: [
          { name: "tileId", type: "uint8", internalType: "uint8" },
          { name: "owner", type: "address", internalType: "address" },
          { name: "color", type: "uint24", internalType: "uint24" },
          { name: "claimedAt", type: "uint64", internalType: "uint64" },
          { name: "message", type: "string", internalType: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "TileClaimed",
    inputs: [
      { name: "tileId", type: "uint8", indexed: true, internalType: "uint8" },
      { name: "owner", type: "address", indexed: true, internalType: "address" },
      { name: "color", type: "uint24", indexed: false, internalType: "uint24" },
      { name: "message", type: "string", indexed: false, internalType: "string" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "InvalidTileId",
    inputs: [{ name: "tileId", type: "uint8", internalType: "uint8" }],
  },
  {
    type: "error",
    name: "TileAlreadyClaimed",
    inputs: [{ name: "tileId", type: "uint8", internalType: "uint8" }],
  },
  {
    type: "error",
    name: "MessageTooLong",
    inputs: [
      { name: "length", type: "uint256", internalType: "uint256" },
      { name: "maxLength", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "MessageBytesExceeded",
    inputs: [
      { name: "byteLength", type: "uint256", internalType: "uint256" },
      { name: "maxBytes", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "InvalidColor",
    inputs: [{ name: "color", type: "uint24", internalType: "uint24" }],
  },
] as const;

export function parseValidContractAddress(raw?: string | null): `0x${string}` | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "0x0000000000000000000000000000000000000000") {
    return null;
  }
  return isAddress(trimmed) ? (trimmed as `0x${string}`) : null;
}


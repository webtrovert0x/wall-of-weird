# BOT Wall of Weird — Technical Whitepaper

> *"A little piece of weirdness, permanently on-chain."*  
> **100 tiles. Unlimited creativity. One shared wall.**

---

## 1. Abstract

**BOT Wall of Weird** is a minimal, permanent, collaborative on-chain pixel canvas built for **BOT Chain Testnet** (`Chain ID: 968`). The wall consists of exactly **100 tiles** arranged in a `10 × 10` grid (`Tile #0` through `Tile #99`).

Any visitor with a compatible EVM wallet can connect, select an unclaimed tile, choose a 24-bit RGB colour (`0x000000`–`0xFFFFFF`), optionally attach a short message (up to `40` UTF-8 characters), and execute an on-chain transaction to claim that tile permanently.

By design, the protocol has **no mint price, no protocol fee, no service fee, no token rewards, and no admin override**. Every interaction is strictly non-payable and costs only ordinary BOT Chain Testnet network gas.

---

## 2. Design Philosophy

Many collaborative canvases degrade into speculative bidding wars or centralized databases with mutable state. BOT Wall of Weird follows three strict principles:

1. **Permanence over Mutability**: Once a tile is claimed, it cannot be edited, overwritten, reclaimed, or deleted—not even by the original claimer or the contract deployer.
2. **Gas-Only Participation**: All contract calls are non-payable (`0 BOT` value). Participation requires only network gas for transaction execution.
3. **Verifiable Truth**: Every colour, message, timestamp, owner, and activity feed entry is sourced directly from deployed contract state and `TileClaimed` event logs on BOT Chain Testnet—never mocked or cached centrally.

---

## 3. Target Network Specification

| Parameter | Value |
| --- | --- |
| Network | BOT Chain Testnet |
| Chain ID | `968` |
| JSON-RPC Endpoint | `https://rpc.bohr.life` |
| Native Gas Token | `BOT` |
| Block Explorer | `https://scan.bohr.life/` |

---

## 4. Smart Contract Architecture (`BOTWallOfWeird.sol`)

Implemented in **Solidity `0.8.20`** with zero external inheritance or privileged roles (`contracts/src/BOTWallOfWeird.sol`).

### 4.1 Constants & Limits

- `WALL_SIZE = 100` (valid tile indices: `0..99`)
- `MAX_COLOR = 0xFFFFFF` (full 24-bit RGB range)
- `MAX_MESSAGE_LENGTH = 40` (maximum Unicode/UTF-8 character count)
- `MAX_MESSAGE_BYTES = 160` (hard UTF-8 byte ceiling to bound calldata/loop gas)

### 4.2 Data Model & Storage Packing

Each tile is stored in a fixed-size array `Tile[100] private _tiles`:

```solidity
struct Tile {
    address owner;    // 20 bytes
    uint24 color;     //  3 bytes
    bool claimed;     //  1 byte
    uint64 claimedAt; //  8 bytes  -> packs tightly into 1 storage slot (32 bytes)
    string message;   // dynamic UTF-8 message
}
```

Packing `owner`, `color`, `claimed`, and `claimedAt` into a single 32-byte EVM word minimizes `SSTORE` gas during `claimTile` and `SLOAD` overhead when reading the entire 100-tile wall via `getWall()`.

### 4.3 State Transition (`claimTile`)

```solidity
function claimTile(
    uint8 tileId,
    uint24 color,
    string calldata message
) external
```

Validation checks executed prior to state mutation:
1. **Bounds Check**: Reverts with `InvalidTileId(tileId)` if `tileId >= 100`.
2. **Immutability Check**: Reverts with `TileAlreadyClaimed(tileId)` if `_tiles[tileId].claimed == true`.
3. **Colour Range Check**: Validates `color <= 0xFFFFFF` (`uint24`).
4. **Message Size & Length Check**: Reverts with `MessageBytesExceeded` if `bytes(message).length > 160`, and `MessageTooLong` if UTF-8 character count (`_utf8Length(message)`) exceeds `40`.

Upon passing validation:
- Writes `Tile` permanently to `_tiles[tileId]`.
- Increments `totalClaimed`.
- Marks `hasContributed[msg.sender] = true` and increments `uniqueContributors` on a wallet's first claim (allowing a single contributor to claim multiple *different* unoccupied tiles while accurately distinguishing total claimed tiles from unique contributors).
- Appends `tileId` to `_claimOrder` (bounded to at most 100 entries).
- Emits `TileClaimed(tileId, msg.sender, color, message, block.timestamp)`.

### 4.4 Read Interfaces

- `getTile(uint8 tileId) -> Tile`: Returns full tile data for `0..99`.
- `getWall() -> Tile[100]`: Returns all 100 tiles in grid order (`row = id / 10`, `col = id % 10`).
- `getStats() -> (uint256 claimedCount, uint256 remainingCount, uint256 contributorCount)`: Returns live completion and contributor metrics.
- `getRecentClaims() -> RecentClaim[]`: Returns all claimed tiles ordered newest-first.

---

## 5. Frontend & Transaction Lifecycle

The web application (`/frontend`) is built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **wagmi v2**, **viem**, and **Reown AppKit**.

### 5.1 On-Chain Integrity Guards

1. **Deployment Verification**: Before rendering live wall data, the client verifies `CONTRACT_ADDRESS` validity and queries `eth_getCode` (`publicClient.getBytecode`) on Chain ID `968`. If unconfigured or undeployed, an explicit setup/deployment banner is displayed instead of placeholder tiles.
2. **Chain Enforcement**: Connected wallets on any chain other than `968` are blocked from claiming and offered a one-click switch to BOT Chain Testnet.
3. **Confirmation-Gated UX**: After submitting `claimTile`, the UI transitions through:
   - `signing` (awaiting wallet approval)
   - `confirming` (transaction hash submitted, awaiting block inclusion)
   - `confirmed` (only after `waitForTransactionReceipt` returns `status === "success"`, followed by re-fetching `getWall`, `getStats`, `getRecentClaims`, and `TileClaimed` event logs)
4. **Event-Backed Activity Feed**: `TileClaimed` logs provide exact transaction hashes linking every claimed tile and feed entry directly to `https://scan.bohr.life/tx/<hash>`.

### 5.2 Secret Handling

- `PRIVATE_KEY` is used strictly by Foundry (`DeployBOTWallOfWeird.s.sol`) and never exposed to the Next.js client.
- `REOWN_ID` is stored without `VITE_` or `NEXT_PUBLIC_` prefixes and read dynamically server-side in `app/layout.tsx`.

---

## 6. Security & Trust Assumptions

- **No Owner / Admin Privileges**: There is no `owner`, `admin`, `pause`, `withdraw`, `upgrade`, or `editTile` function in `BOTWallOfWeird.sol`.
- **No Financial Custody**: Because no function is `payable`, the contract never holds `BOT` or ERC-20 funds, eliminating fund-drain attack surfaces.
- **Bounded Loops**: `getWall()` iterates a fixed `100` slots; `getRecentClaims()` iterates at most `100` entries; `_utf8Length()` iterates at most `160` bytes. None can cause unbounded gas exhaustion.

---

## 7. Verification

The Foundry unit test suite (`contracts/test/BOTWallOfWeird.t.sol`) validates:
- Claiming an available tile with and without a message
- Rejecting duplicate claims from both third-party and original owner addresses
- Rejecting invalid tile IDs (`>= 100`)
- Enforcing the 40-character message limit (accepting 40, reverting on 41)
- Preserving exact 24-bit RGB boundary values (`0x000000`, `0xFFFFFF`, arbitrary hex)
- Accurate `uniqueContributors` vs `totalClaimed` statistics
- Exact `TileClaimed` event parameters and `getWall()` / `getRecentClaims()` ordering

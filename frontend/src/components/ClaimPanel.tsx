"use client";

import { useMemo, useState } from "react";
import { BaseError, ContractFunctionRevertedError } from "viem";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { BOT_CHAIN_ID, getExplorerTxUrl } from "@/lib/chain";
import { BOT_WALL_OF_WEIRD_ABI } from "@/lib/contract";
import { hexToUint24, shortenAddress, type TileData } from "@/lib/types";
import { useWalletModal } from "./Web3Provider";

const PRESET_COLORS = [
  "#22D3EE",
  "#8B5CF6",
  "#10B981",
  "#F43F5E",
  "#F59E0B",
  "#EC4899",
  "#FFFFFF",
  "#A3E635",
];

type TxStage = "idle" | "signing" | "confirming" | "confirmed" | "error";

interface ClaimPanelProps {
  contractAddress: `0x${string}` | null;
  isConfigured: boolean;
  isDeployed: boolean;
  selectedTile: TileData | null;
  onClaimConfirmed: () => Promise<void>;
  onClearSelection: () => void;
}

function extractReadableError(err: unknown): string {
  if (err instanceof BaseError) {
    const revertError = err.walk(
      (e) => e instanceof ContractFunctionRevertedError
    );
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName;
      if (errorName === "TileAlreadyClaimed") {
        return "This tile was already claimed on-chain. Select another empty tile.";
      }
      if (errorName === "InvalidTileId") {
        return "Invalid tile ID. Must be between 0 and 99.";
      }
      if (errorName === "MessageTooLong") {
        return "Message exceeds the 40-character on-chain limit.";
      }
      if (errorName === "MessageBytesExceeded") {
        return "Message exceeds the maximum UTF-8 byte limit (160 bytes).";
      }
      if (errorName === "InvalidColor") {
        return "Invalid RGB color value.";
      }
      if (revertError.shortMessage) {
        return revertError.shortMessage;
      }
    }

    const msg = err.shortMessage || err.message;
    const lower = msg.toLowerCase();
    if (
      lower.includes("user rejected") ||
      lower.includes("user denied") ||
      lower.includes("rejected the request")
    ) {
      return "Transaction was rejected in your wallet.";
    }
    if (lower.includes("insufficient funds")) {
      return "Insufficient BOT balance to cover the network gas fee.";
    }
    return msg;
  }

  if (err instanceof Error) {
    const lower = err.message.toLowerCase();
    if (lower.includes("user rejected") || lower.includes("user denied")) {
      return "Transaction was rejected in your wallet.";
    }
    if (lower.includes("insufficient funds")) {
      return "Insufficient BOT balance to cover the network gas fee.";
    }
    return err.message;
  }

  return "Transaction failed. Please check your wallet and RPC connection.";
}

export function ClaimPanel({
  contractAddress,
  isConfigured,
  isDeployed,
  selectedTile,
  onClaimConfirmed,
  onClearSelection,
}: ClaimPanelProps) {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: BOT_CHAIN_ID });
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { hasReownId, openWalletModal } = useWalletModal();

  const [colorHex, setColorHex] = useState("#22D3EE");
  const [message, setMessage] = useState("");
  const [txStage, setTxStage] = useState<TxStage>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const charCount = useMemo(() => Array.from(message).length, [message]);
  const byteCount = useMemo(
    () => new TextEncoder().encode(message).length,
    [message]
  );
  const parsedColor = useMemo(() => hexToUint24(colorHex), [colorHex]);

  const isCorrectChain = isConnected && chainId === BOT_CHAIN_ID;
  const isBusy = txStage === "signing" || txStage === "confirming";

  const validationError = useMemo(() => {
    if (!isConfigured || !contractAddress) {
      return "Contract address is not configured yet.";
    }
    if (!isDeployed) {
      return "Contract is not deployed on BOT Chain Testnet (968).";
    }
    if (!selectedTile) {
      return "Select an empty tile on the wall first.";
    }
    if (selectedTile.claimed) {
      return "Selected tile is already claimed.";
    }
    if (parsedColor === null) {
      return "Enter a valid 6-digit hex RGB colour (e.g. #22D3EE).";
    }
    if (charCount > 40) {
      return "Message cannot exceed 40 characters.";
    }
    if (byteCount > 160) {
      return "Message exceeds 160 UTF-8 bytes.";
    }
    if (!isConnected || !address) {
      return "Connect your wallet to claim this tile.";
    }
    if (!isCorrectChain) {
      return "Switch your wallet to BOT Chain Testnet (Chain ID 968).";
    }
    return null;
  }, [
    address,
    byteCount,
    charCount,
    contractAddress,
    isConfigured,
    isConnected,
    isCorrectChain,
    isDeployed,
    parsedColor,
    selectedTile,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (validationError || !contractAddress || !selectedTile || parsedColor === null) {
      setErrorMessage(validationError ?? "Invalid claim parameters.");
      return;
    }

    if (!publicClient) {
      setErrorMessage("BOT Chain Testnet RPC client is unavailable.");
      return;
    }

    try {
      setTxStage("signing");
      setTxHash(null);

      // Strictly non-payable: gas fee only, zero BOT value sent.
      const submittedHash = await writeContractAsync({
        address: contractAddress,
        abi: BOT_WALL_OF_WEIRD_ABI,
        functionName: "claimTile",
        args: [selectedTile.id, parsedColor, message],
        chainId: BOT_CHAIN_ID,
      });

      setTxHash(submittedHash);
      setTxStage("confirming");

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: submittedHash,
      });

      if (receipt.status !== "success") {
        throw new Error("Transaction reverted on-chain.");
      }

      await onClaimConfirmed();
      setTxStage("confirmed");
      setMessage("");
    } catch (err) {
      setTxStage("error");
      setErrorMessage(extractReadableError(err));
    }
  }

  return (
    <aside className="rounded-xl border border-slate-800/90 bg-[#0f121b] p-5 sm:p-6 pixel-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Claim a Tile</h2>
          <p className="text-xs text-slate-400">
            Permanent on-chain placement • Network gas only
          </p>
        </div>
        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono-pixel text-emerald-300">
          0 BOT Fee
        </span>
      </div>

      {!selectedTile ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-700 bg-[#090b12] p-6 text-center">
          <p className="font-mono-pixel text-sm text-slate-300">
            No tile selected
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            Click any dark unclaimed tile (#0–#99) on the 10 × 10 wall to customize its RGB colour and optional message.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Selected Tile Header */}
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#090b12] px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className="h-6 w-6 rounded-xs border border-white/25"
                style={{
                  backgroundColor: parsedColor !== null ? colorHex : "#131724",
                }}
              />
              <div>
                <p className="text-sm font-bold font-mono-pixel text-cyan-300">
                  Selected: Tile #{selectedTile.id}
                </p>
                <p className="text-[11px] font-mono-pixel text-slate-400">
                  Row {Math.floor(selectedTile.id / 10)}, Col {selectedTile.id % 10}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              disabled={isBusy}
              className="cursor-pointer text-xs font-mono-pixel text-slate-400 hover:text-white disabled:opacity-40"
            >
              Clear
            </button>
          </div>

          {/* Colour Picker */}
          <div>
            <label
              htmlFor="tile-color-hex"
              className="block text-xs font-mono-pixel uppercase tracking-wider text-slate-300"
            >
              RGB Colour
            </label>
            <div className="mt-2 flex items-center gap-2.5">
              <input
                type="color"
                aria-label="Pick tile RGB colour"
                value={parsedColor !== null ? colorHex : "#22D3EE"}
                onChange={(e) => setColorHex(e.target.value.toUpperCase())}
                disabled={isBusy}
                className="h-10 w-12 cursor-pointer rounded border border-slate-700 bg-transparent p-0.5"
              />
              <input
                id="tile-color-hex"
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value.toUpperCase())}
                placeholder="#22D3EE"
                maxLength={7}
                disabled={isBusy}
                className="w-full rounded-md border border-slate-700 bg-[#090b12] px-3 py-2 font-mono-pixel text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColorHex(preset)}
                  disabled={isBusy}
                  aria-label={`Select preset ${preset}`}
                  style={{ backgroundColor: preset }}
                  className={[
                    "h-6 w-6 cursor-pointer rounded-xs border transition hover:scale-110",
                    colorHex.toUpperCase() === preset
                      ? "border-white ring-2 ring-cyan-400"
                      : "border-white/20",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>

          {/* Optional Message */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="tile-message"
                className="block text-xs font-mono-pixel uppercase tracking-wider text-slate-300"
              >
                Message (Optional)
              </label>
              <span
                className={[
                  "text-xs font-mono-pixel",
                  charCount > 40 ? "text-rose-400" : "text-slate-400",
                ].join(" ")}
              >
                {charCount} / 40
              </span>
            </div>
            <input
              id="tile-message"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a weird note on-chain..."
              maxLength={40}
              disabled={isBusy}
              className="mt-2 w-full rounded-md border border-slate-700 bg-[#090b12] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Wallet Info */}
          <div className="rounded-lg border border-slate-800 bg-[#090b12] px-3.5 py-2.5 text-xs font-mono-pixel">
            <span className="block text-[11px] uppercase text-slate-400">
              Claiming Wallet
            </span>
            {isConnected && address ? (
              <span className="mt-0.5 block text-slate-200">
                {shortenAddress(address)} ({address})
              </span>
            ) : (
              <span className="mt-0.5 block text-amber-300">
                Not connected
              </span>
            )}
          </div>

          {/* Wrong Chain Action */}
          {isConnected && !isCorrectChain ? (
            <button
              type="button"
              onClick={() => switchChainAsync({ chainId: BOT_CHAIN_ID })}
              disabled={isSwitching}
              className="w-full cursor-pointer rounded-md border border-amber-400/50 bg-amber-500/20 px-4 py-2.5 text-sm font-mono-pixel font-semibold text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-50"
            >
              {isSwitching
                ? "Switching Network..."
                : "Switch to BOT Chain Testnet (968)"}
            </button>
          ) : null}

          {/* Connect or Claim CTA */}
          {!isConnected ? (
            <button
              type="button"
              onClick={() => (hasReownId ? openWalletModal() : undefined)}
              className="w-full cursor-pointer rounded-md bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2.5 text-sm font-mono-pixel font-semibold text-white transition hover:brightness-110"
            >
              {hasReownId
                ? "Connect Wallet to Claim"
                : "Connect Wallet in Header"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={Boolean(validationError) || isBusy}
              className="w-full cursor-pointer rounded-md bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-mono-pixel font-bold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {txStage === "signing"
                ? "Confirm in Wallet..."
                : txStage === "confirming"
                  ? "Waiting for Confirmation..."
                  : `Claim Tile #${selectedTile.id} (Gas Only)`}
            </button>
          )}
        </form>
      )}

      {/* Transaction Status Feedback */}
      {txStage === "signing" && (
        <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-200">
          Please review and confirm the gas-only transaction in your wallet.
        </div>
      )}

      {txStage === "confirming" && txHash && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <p className="font-semibold">Transaction pending confirmation...</p>
          <a
            href={getExplorerTxUrl(txHash)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block font-mono-pixel underline break-all"
          >
            {txHash} ↗
          </a>
        </div>
      )}

      {txStage === "confirmed" && txHash && (
        <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          <p className="font-semibold">Tile permanently claimed on-chain!</p>
          <a
            href={getExplorerTxUrl(txHash)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block font-mono-pixel text-emerald-300 underline break-all"
          >
            View confirmed transaction: {shortenAddress(txHash)} ↗
          </a>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
          {errorMessage}
        </div>
      )}
    </aside>
  );
}


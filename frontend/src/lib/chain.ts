import { defineChain } from "viem";

export const BOT_CHAIN_ID = 968;
export const BOT_RPC_URL = "https://rpc.bohr.life";
export const BOT_EXPLORER_URL = "https://scan.bohr.life";

export const botChainTestnet = defineChain({
  id: BOT_CHAIN_ID,
  name: "BOT Chain Testnet",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [BOT_RPC_URL],
    },
    public: {
      http: [BOT_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "BOTScan",
      url: BOT_EXPLORER_URL,
    },
  },
  testnet: true,
});

export function getExplorerTxUrl(txHash: string): string {
  return `${BOT_EXPLORER_URL}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${BOT_EXPLORER_URL}/address/${address}`;
}


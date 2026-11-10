"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiProvider, createConfig, http, injected } from "wagmi";
import { BOT_RPC_URL, botChainTestnet } from "@/lib/chain";

interface ReownContextValue {
  hasReownId: boolean;
  openWalletModal: () => Promise<void>;
}

const ReownContext = createContext<ReownContextValue>({
  hasReownId: false,
  openWalletModal: async () => {},
});

export function useWalletModal() {
  return useContext(ReownContext);
}

let appKitInstance: ReturnType<typeof createAppKit> | null = null;
let cachedAdapter: WagmiAdapter | null = null;

function getOrCreateAppKitAdapter(reownId: string): WagmiAdapter {
  if (!cachedAdapter) {
    cachedAdapter = new WagmiAdapter({
      networks: [botChainTestnet],
      projectId: reownId,
      ssr: true,
      transports: {
        [botChainTestnet.id]: http(BOT_RPC_URL),
      },
    });
  }

  if (typeof window !== "undefined" && !appKitInstance) {
    appKitInstance = createAppKit({
      adapters: [cachedAdapter],
      networks: [botChainTestnet],
      defaultNetwork: botChainTestnet,
      projectId: reownId,
      metadata: {
        name: "BOT Wall of Weird",
        description: "Collaborative 10x10 on-chain pixel wall on BOT Chain Testnet",
        url: window.location.origin,
        icons: [],
      },
      themeMode: "dark",
      features: {
        analytics: false,
      },
    });
  }

  return cachedAdapter;
}

const fallbackConfig = createConfig({
  chains: [botChainTestnet],
  transports: {
    [botChainTestnet.id]: http(BOT_RPC_URL),
  },
  connectors: [injected()],
  ssr: true,
});

interface Web3ProviderProps {
  children: ReactNode;
  reownId: string;
}

export function Web3Provider({ children, reownId }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  const trimmedReownId = reownId.trim();
  const hasReownId = trimmedReownId.length > 0;

  const wagmiConfig = useMemo(() => {
    if (!hasReownId) {
      return fallbackConfig;
    }
    const adapter = getOrCreateAppKitAdapter(trimmedReownId);
    return adapter.wagmiConfig;
  }, [hasReownId, trimmedReownId]);

  useEffect(() => {
    if (hasReownId) {
      getOrCreateAppKitAdapter(trimmedReownId);
    }
  }, [hasReownId, trimmedReownId]);

  const contextValue = useMemo<ReownContextValue>(
    () => ({
      hasReownId,
      openWalletModal: async () => {
        if (appKitInstance) {
          await appKitInstance.open();
        }
      },
    }),
    [hasReownId]
  );

  return (
    <ReownContext.Provider value={contextValue}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </ReownContext.Provider>
  );
}


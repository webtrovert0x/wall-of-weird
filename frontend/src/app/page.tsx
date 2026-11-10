import { WallDashboard } from "@/components/WallDashboard";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const rawContractAddress = (
    process.env.CONTRACT_ADDRESS ??
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
    ""
  ).trim();

  const parsedDeployBlock = Number.parseInt(
    process.env.DEPLOY_BLOCK?.trim() || "0",
    10
  );
  const deployBlock = Number.isFinite(parsedDeployBlock) && parsedDeployBlock > 0
    ? parsedDeployBlock
    : 0;

  const hasReownId = Boolean(process.env.REOWN_ID?.trim());

  return (
    <WallDashboard
      rawContractAddress={rawContractAddress}
      deployBlock={deployBlock}
      hasReownId={hasReownId}
    />
  );
}


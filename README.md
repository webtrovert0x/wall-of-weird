# BOT Wall of Weird

An on-chain collaborative 10 × 10 pixel wall built for **BOT Chain Testnet**.

Visitors connect their wallet via **Reown AppKit**, pick an unclaimed tile (`#0`–`#99`), select an RGB colour, optionally attach a message (up to 40 characters), and submit a non-payable transaction to claim that tile permanently on-chain. **Every contract interaction requires network gas only — zero protocol fees or BOT value transfers.**

---

## Network Configuration (BOT Chain Testnet)

| Setting | Value |
| --- | --- |
| Network Name | BOT Chain Testnet |
| Chain ID | `968` |
| RPC URL | `https://rpc.bohr.life` |
| Native Token | `BOT` |
| Explorer | `https://scan.bohr.life/` |

---

## Project Structure

```text
.
├── .env                  # Your private local secrets & contract config (gitignored)
├── .env.example          # Environment variable template
├── contracts/            # Foundry smart contract workspace
│   ├── foundry.toml
│   ├── src/BOTWallOfWeird.sol
│   ├── test/BOTWallOfWeird.t.sol
│   └── script/DeployBOTWallOfWeird.s.sol
└── frontend/             # Next.js (TypeScript + Tailwind + wagmi + viem + Reown AppKit)
```

---

## 1. Configure `.env`

Open `.env` in the workspace root (already created from `.env.example`, and symlinked into `contracts/.env` and `frontend/.env`) and add:

```env
PRIVATE_KEY=0xYOUR_TESTNET_DEPLOYER_PRIVATE_KEY
REOWN_ID=YOUR_REOWN_PROJECT_ID
CONTRACT_ADDRESS=
DEPLOY_BLOCK=0
```

- `PRIVATE_KEY`: Used **only** by Foundry during contract deployment. Never exposed to the frontend.
- `REOWN_ID`: Your Project ID from [Reown Cloud](https://cloud.reown.com) (read server-side in Next.js; not prefixed with `VITE_` or `NEXT_PUBLIC_`).
- `CONTRACT_ADDRESS`: Leave empty until you deploy `BOTWallOfWeird.sol`. While empty, the frontend displays a clear deployment-configuration state instead of mock data.

---

## 2. Smart Contract Tests (Foundry)

From the project root:

```bash
forge test --root contracts -vv
```

Or inside `contracts/`:

```bash
cd contracts
forge test -vv
```

Tests verify:
- Claiming an available tile (with or without a message)
- Rejecting duplicate claims (both by another wallet and the same wallet)
- Rejecting invalid tile IDs (`>= 100`)
- Allowing 40-character messages and rejecting `> 40` characters
- Exact 24-bit RGB colour boundary storage (`0x000000`–`0xFFFFFF`)
- Unique contributor counting and live wall statistics (`getStats`)
- `TileClaimed` event emission
- `getWall()` and `getRecentClaims()` state ordering

---

## 3. Deploy to BOT Chain Testnet

Make sure the wallet corresponding to `PRIVATE_KEY` in `.env` holds testnet `BOT` for deployment gas.

Run from the `contracts/` directory:

```bash
cd contracts
forge script script/DeployBOTWallOfWeird.s.sol:DeployBOTWallOfWeird \
  --rpc-url https://rpc.bohr.life \
  --broadcast
```

When deployment confirms:
1. Copy the printed deployed contract address from the Foundry output.
2. Paste it into `.env` at the project root:
   ```env
   CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ```
3. (Optional) Also set `DEPLOY_BLOCK=<block_number>` from the deployment receipt so `TileClaimed` event queries start directly at deployment.
4. Confirm the deployment transaction on [BOTScan](https://scan.bohr.life/).

---

## 4. Run the Frontend

From the project root:

```bash
cd frontend
npm install   # if not already installed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For production builds:

```bash
cd frontend
npm run build
npm run start
```


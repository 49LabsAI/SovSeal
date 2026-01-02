const hre = require("hardhat");

/**
 * SovSeal Contract Deployment Script
 * 
 * Multi-chain deployment support:
 * 
 * Production:
 *   Base:           npx hardhat run scripts/deploy.js --network base
 *   Asset Hub:      npx hardhat run scripts/deploy.js --network assetHub (Jan 20, 2026)
 * 
 * Testnet:
 *   Base Sepolia:   npx hardhat run scripts/deploy.js --network baseSepolia
 *   Passet Hub:     npx hardhat run scripts/deploy.js --network passetHub
 *   Local:          npx hardhat run scripts/deploy.js --network localhost
 */

// Network metadata for better logging
const NETWORK_INFO = {
  base: {
    displayName: "Base Mainnet",
    explorer: "https://basescan.org",
    isMainnet: true,
    ecosystem: "Coinbase L2",
  },
  baseSepolia: {
    displayName: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
    isMainnet: false,
    ecosystem: "Coinbase L2",
  },
  assetHub: {
    displayName: "Polkadot Asset Hub",
    explorer: "https://assethub-polkadot.subscan.io",
    isMainnet: true,
    ecosystem: "Polkadot",
  },
  passetHub: {
    displayName: "Passet Hub Testnet",
    explorer: "https://blockscout-passet-hub.parity-testnet.parity.io",
    isMainnet: false,
    ecosystem: "Polkadot",
  },
  localhost: {
    displayName: "Local Hardhat",
    explorer: null,
    isMainnet: false,
    ecosystem: "Local",
  },
  hardhat: {
    displayName: "Hardhat Network",
    explorer: null,
    isMainnet: false,
    ecosystem: "Local",
  },
};

async function main() {
  const networkName = hre.network.name;
  const networkInfo = NETWORK_INFO[networkName] || {
    displayName: networkName,
    explorer: null,
    isMainnet: false,
    ecosystem: "Unknown",
  };

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║           SovSeal Smart Contract Deployment                ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Network:    ${networkInfo.displayName}`);
  console.log(`Ecosystem:  ${networkInfo.ecosystem}`);
  console.log(`Type:       ${networkInfo.isMainnet ? "🔴 MAINNET" : "🟡 TESTNET"}\n`);

  if (networkInfo.isMainnet) {
    console.log("⚠️  WARNING: You are deploying to a MAINNET");
    console.log("   This is a production deployment with real value.\n");
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInEth = hre.ethers.formatEther(balance);
  console.log("Balance:", balanceInEth, networkName === "base" || networkName === "baseSepolia" ? "ETH" : "tokens");
  console.log();

  if (balance === 0n) {
    throw new Error("Deployer account has no balance. Please fund the account first.");
  }

  console.log("Deploying FutureProof (SovSeal) contract...");

  const SovSeal = await hre.ethers.getContractFactory("FutureProof");
  const sovseal = await SovSeal.deploy();

  console.log("Waiting for deployment confirmation...");
  await sovseal.waitForDeployment();

  const address = await sovseal.getAddress();
  console.log("\n✅ SovSeal deployed to:", address);

  // Verify deployment
  const messageCount = await sovseal.getMessageCount();
  console.log("Message count:", messageCount.toString());

  console.log("\n" + "═".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("═".repeat(60));

  console.log(`\nNetwork:      ${networkInfo.displayName}`);
  console.log(`Contract:     ${address}`);
  console.log(`Deployer:     ${deployer.address}`);

  if (networkInfo.explorer) {
    console.log(`\nExplorer:     ${networkInfo.explorer}/address/${address}`);
  }

  console.log("\n📋 Update your environment:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`   NEXT_PUBLIC_NETWORK=${networkName === "base" ? "base" : networkName === "baseSepolia" ? "base-sepolia" : networkName === "assetHub" ? "asset-hub" : "passet-hub"}`);

  return { address, network: networkName };
}

main()
  .then(({ address, network }) => {
    console.log(`\n🎉 Successfully deployed to ${network}: ${address}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  });

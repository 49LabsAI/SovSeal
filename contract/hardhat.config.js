require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // ===========================================
    // BASE (Primary Production Network)
    // ===========================================
    // Base Mainnet - very low fees (~$0.001-0.01 per tx)
    // Use: npx hardhat run scripts/deploy.js --network base
    base: {
      url: process.env.BASE_RPC || "https://mainnet.base.org",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 8453,
      timeout: 60000,
    },
    // Base Sepolia Testnet
    // Use: npx hardhat run scripts/deploy.js --network baseSepolia
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      timeout: 60000,
    },
    // ===========================================
    // POLKADOT (Secondary, Jan 20, 2026)
    // ===========================================
    // Polkadot Asset Hub Mainnet (available January 20, 2026)
    // Use: npx hardhat run scripts/deploy.js --network assetHub
    assetHub: {
      url: process.env.MAINNET_RPC || "https://polkadot-asset-hub-eth-rpc.polkadot.io",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 420420421,
      timeout: 120000,
    },
    // Passet Hub Testnet (Polkadot testnet)
    // Use: npx hardhat run scripts/deploy.js --network passetHub
    passetHub: {
      url: process.env.PASSET_HUB_RPC || "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 420420422,
      timeout: 60000,
    },
    // ===========================================
    // LOCAL DEVELOPMENT
    // ===========================================
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};

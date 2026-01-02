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
        // POLKADOT (Secondary, Jan 20, 2026)
        // ===========================================
        // Polkadot Asset Hub Mainnet (available January 20, 2026)
        assetHub: {
            url: process.env.MAINNET_RPC || "https://polkadot-asset-hub-eth-rpc.polkadot.io",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            chainId: 420420421,
            timeout: 120000,
        },
        // Passet Hub Testnet (Polkadot testnet)
        passetHub: {
            url: process.env.PASSET_HUB_RPC || "https://testnet-passet-hub-eth-rpc.polkadot.io",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 420420422,
            timeout: 60000,
        },
        hardhat: {
            chainId: 31337,
        },
    },
    paths: {
        sources: "./src",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

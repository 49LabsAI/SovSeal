<div align="center">
  <img src="public/logo.png" alt="SovSeal Logo" width="120" height="120" />
  
  # SovSeal
  
  **The Sovereign Protocol for Digital Legacy**
  
  *Guaranteed by math, not corporations*
</div>

SovSeal (Sovereign Seal) is an institutional-grade protocol for digital legacy and time-locked media. Create encrypted vaults using client-side encryption, IPFS storage, and Polkadot blockchain — selling Admissibility, Security, and Finality.

## 📦 Open Core Packages

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)](https://soliditylang.org/)

SovSeal follows the [Open Core](https://en.wikipedia.org/wiki/Open-core_model) model. The protocol standards are open source (Apache 2.0), while the managed platform remains proprietary.

| Package | Description | License |
|---------|-------------|---------|
| [@sovseal/contracts](./packages/contracts) | Smart contracts (SovSeal.sol, SovSealRecovery.sol) | Apache 2.0 |
| [@sovseal/sdk](./packages/sdk) | TypeScript SDK for protocol integration | Apache 2.0 |

### Quick Start for Developers

```bash
npm install @sovseal/sdk ethers
```

```typescript
import { SovSealClient, CryptoService } from '@sovseal/sdk';

const client = new SovSealClient({
  rpcUrl: 'https://polkadot-asset-hub-eth-rpc.polkadot.io',
  contractAddress: '0x...',
});

const messages = await client.getReceivedMessages('0x...');
```

## 🎯 Overview

SovSeal is a privacy-first protocol that enables secure, legally-admissible digital legacy management. Record or upload audio/video content, encrypt it locally in your browser, store it on decentralized IPFS, and set a future unlock time enforced by the Polkadot blockchain. No corporation, server, or third party can access your content before the unlock time—it's guaranteed by cryptography and blockchain consensus.

## ✨ Features

- 🔐 **Client-side encryption** with AES-256-GCM (all encryption happens in your browser)
- 🌐 **Decentralized storage** via IPFS using Storacha Network
- ⛓️ **Blockchain-enforced unlock conditions** on Passet Hub (Polkadot testnet)
- 🎥 **Record or upload** audio/video content directly in the browser
- ⏰ **Time-locked delivery** with timestamp verification
- 🦊 **Talisman wallet integration** for blockchain interactions
- 📦 **Recipient-without-wallet flow** using redeem packages with passphrase protection
- 📊 **Dashboard** to track sent and received vaults with real-time status updates
- 📜 **Certificate of Authenticity** (roadmap) for legally-admissible proof
- 🛡️ **Social Recovery** (roadmap) with Shamir's Secret Sharing

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client-Side)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Next.js Application                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   UI Layer   │  │ Crypto Layer │  │ Wallet Layer │ │ │
│  │  │  (React)     │  │ (Web Crypto) │  │(Talisman/MM) │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ Media Layer  │  │ Storage Layer│  │Contract Layer│ │ │
│  │  │(MediaRecorder│  │ (Storacha)   │  │  (Solidity)  │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Storacha   │    │   Passet Hub │    │  Talisman/   │
│   Network    │    │   (Polkadot  │    │   MetaMask   │
│   (IPFS)     │    │   Testnet)   │    │   Wallets    │
└──────────────┘    └──────────────┘    └──────────────┘
```

### How It Works

1. **Create**: Record or upload audio/video content
2. **Encrypt**: Generate unique AES-256 key and encrypt content locally
3. **Store**: Upload encrypted content to IPFS via Storacha Network
4. **Anchor**: Submit metadata (CID, unlock timestamp, recipient) to Solidity smart contract on Passet Hub
5. **Wait**: Blockchain enforces the time-lock until unlock timestamp
6. **Unlock**: Recipient decrypts and plays content after timestamp passes

## 🎯 Product Concepts

### The Vault (Digital Wills)
For estate planners and HNWIs — secure, legally-admissible digital will supplements with multi-heir designation and social recovery.

### The Shield (Whistleblower Deterrence)
For journalists and activists — dead man's switch with automated release if check-ins are missed.

### The Escrow (B2B Asset Handover)
For legal professionals — cryptographic proof of content integrity with time-locked document releases.

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Blockchain**: ethers.js v6 for Ethereum-compatible RPC on Passet Hub testnet
- **Smart Contracts**: Solidity 0.8.20 compiled to PolkaVM via pallet-revive
- **RPC Endpoint**: Ethereum JSON-RPC (https://testnet-passet-hub-eth-rpc.polkadot.io)
- **Storage**: Storacha Network (formerly Web3.Storage) for decentralized IPFS storage
- **Wallet**: Talisman or MetaMask browser extension (Ethereum-compatible)
- **Cryptography**: Web Crypto API (AES-256-GCM, RSA-OAEP)
- **Media**: MediaRecorder API for recording

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js 18+** and npm
- **Talisman wallet (recommended)** or **MetaMask** with **Ethereum account** ([Setup Guide](WALLET_SETUP_GUIDE.md))
  - ⚠️ **Important:** Must use Ethereum address (0x...), not Substrate address (5...)
- **Storacha Network account** (email-based authentication - [Learn more](https://storacha.network/))
- **Passet Hub testnet tokens (PAS)** from faucet: https://faucet.polkadot.io/paseo

### Connection Improvements ✨ NEW

SovSeal now features **persistent connections** that survive page refreshes and browser restarts:

- **Wallet connections persist** - Connect once, stay connected
- **Storacha authentication persists** - No need to re-verify email
- **Visual connection status** - Always know what's connected
- **Partial state recovery** - Resume setup if interrupted

See the [User Connection Guide](docs/USER_CONNECTION_GUIDE.md) for details.

### Storacha Setup

SovSeal uses Storacha Network for decentralized storage. To enable uploads:

1. Start the development server (see below)
2. Navigate to **Settings** in the app
3. Enter your email address and click "Connect with Storacha"
4. Check your email and click the verification link
5. Your space will be created automatically
6. Connection persists across sessions - no need to reconnect!

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/sovseal.git
cd sovseal
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

4. **Configure environment variables:**

Edit `.env.local` with your configuration:

```env
# Smart Contract Configuration
# IMPORTANT: Use Ethereum address format (0x...), NOT Substrate format (5...)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xeD0fDD2be363590800F86ec8562Dde951654668F
NEXT_PUBLIC_RPC_ENDPOINT=https://testnet-passet-hub-eth-rpc.polkadot.io
NEXT_PUBLIC_NETWORK=passet-hub

# Storacha Network Configuration
NEXT_PUBLIC_STORACHA_GATEWAY=storacha.link
# Note: Storacha uses email-based authentication - no API keys required!
# Authentication happens in-browser via UCAN delegation
# See: https://docs.storacha.network/js-client/
```

### Environment Variables Explained

| Variable                       | Required | Description                                                                        |
| ------------------------------ | -------- | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Yes      | **Ethereum-format address (0x...)** of deployed Solidity contract                  |
| `NEXT_PUBLIC_RPC_ENDPOINT`     | Yes      | Passet Hub Ethereum RPC endpoint: `https://testnet-passet-hub-eth-rpc.polkadot.io` |
| `NEXT_PUBLIC_NETWORK`          | Yes      | Network name (use `passet-hub` for testnet)                                        |
| `NEXT_PUBLIC_STORACHA_GATEWAY` | No       | Storacha gateway URL (default: `storacha.link`)                                    |

**Important:** Passet Hub uses pallet-revive (PolkaVM) which requires **Ethereum-format addresses (0x...)**, not Substrate SS58 addresses (5...).

### Getting Testnet Tokens

To interact with Passet Hub testnet, you'll need PAS tokens:

- **Polkadot Faucet**: https://faucet.polkadot.io/paseo

**Steps:**

1. Install and open Talisman (recommended) or MetaMask wallet
2. **Important:** Create an **Ethereum account** (0x... format)
   - Talisman: Create a new Ethereum account (not Polkadot)
   - MetaMask: All accounts are Ethereum by default
   - Talisman: Select "Ethereum" when creating account (NOT "Polkadot")
3. Copy your Ethereum address (starts with 0x)
4. Visit the faucet and request tokens
5. Wait for confirmation (usually takes 1-2 minutes)

**Note:** Passet Hub uses pallet-revive which requires Ethereum-format addresses (0x...). Substrate addresses (5...) will not work.

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

Create an optimized production build:

```bash
npm run build
npm start
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## Project Structure

```
sovseal/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Core services (encryption, IPFS, contracts)
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── contract/         # Solidity smart contracts
└── docs/             # Documentation
```

## 🔒 Privacy Guarantees

SovSeal is designed with privacy as the foundation. Here's what makes it secure:

### Client-Side Encryption

- **All encryption/decryption happens in your browser** using the Web Crypto API
- **No plaintext media or keys ever leave your device**
- Each message uses a unique AES-256-GCM encryption key
- Keys are encrypted with recipient's public key before storage

### Decentralized Architecture

- **No central servers** can access your content
- **IPFS schorage** ensures content is distributed across multiple nodes
- **Blockchain consensus** enforces unlock conditions—no single authority can override them
- **Open source** code allows anyone to verify the implementation

### Zero-Knowledge Design

- Application never sees your unencrypted content
- Web3.Storage only receives encrypted blobs (meaningless without the key)
- Smart contract only stores metadata (CIDs, timestamps, addresses)
- Talisman wallet keeps your private keys secure

### Memory Safety

- Decrypted content exists only in browser memory during playback
- Object URLs are automatically revoked after use
- Sensitive data is cleared from memory after operations
- No decrypted content is written to disk or cache

### Timestamp Enforcement

- Unlock times are enforced by blockchain consensus
- Recipients cannot decrypt before the timestamp (even with the encrypted key)
- Verification happens on-chain, not in the application

## ⚠️ Important Security Notes

### Key Backup Warning

**CRITICAL: Back up your Talisman wallet seed phrase immediately!**

- If you lose access to your wallet, **you cannot decrypt received messages**
- There is no password recovery or account restoration
- Your seed phrase is the ONLY way to recover your private keys
- Store it securely offline (never digitally or in the cloud)

### Storage Limitations

**Storacha Network Free Tier:**

- Free tier provides 5GB storage + egress per month
- Content is pinned automatically with 99.9% availability
- For critical long-term storage, consider:
  - **Paid Storacha plans** for increased storage and guaranteed persistence
  - **Arweave** for permanent storage
  - **Export encrypted CIDs** and store them separately (see below)

### Export Procedure for Encrypted CIDs

To ensure long-term access to your messages, export and back up the encrypted CIDs:

1. **From Dashboard**: Navigate to your sent/received messages
2. **Copy CIDs**: Note the `encryptedMessageCID` and `encryptedKeyCID` for each message
3. **Store Securely**: Save these CIDs in a secure location (encrypted backup, password manager)
4. **Re-pin if Needed**: You can re-upload content to IPFS using the CIDs if original pins expire
5. **Blockchain Metadata**: Message metadata remains on-chain permanently

**Example backup format:**

```json
{
  "messageId": "0x123...",
  "encryptedMessageCID": "bafybeig...",
  "encryptedKeyCID": "bafybeih...",
  "unlockTimestamp": 1735689600,
  "recipient": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
}
```

## 📱 Platform Limitations

### iOS Safari Limitations

**MediaRecorder API Support:**

- iOS Safari has limited MediaRecorder API support
- Recording may not work on older iOS versions (< iOS 14.3)
- **Fallback**: Upload-only mode is automatically enabled on unsupported devices
- Users can record on another device and upload the file

**Recommended Approach:**

- Use desktop browsers (Chrome, Firefox, Edge) for recording
- Use iOS Safari for uploading pre-recorded files
- Test on your specific iOS version before relying on recording

### Mobile Wallet Limitations

**Desktop Extension Required:**

- Talisman wallet is currently a **desktop browser extension only**
- Mobile wallet support (WalletConnect or Talisman mobile) is not yet implemented
- **Workaround**: Use the redeem package flow for mobile recipients

**Redeem Package Flow:**

- Senders can create a redeem package with passphrase protection
- Recipients receive a claim link they can open on mobile
- After setting up Talisman on desktop, they can import and decrypt the message

## 📦 Smart Contract

The SovSeal smart contract is written in Solidity 0.8.20 and deployed to Passet Hub testnet via pallet-revive (PolkaVM).

### Contract Details

- **Language**: Solidity 0.8.20
- **Network**: Passet Hub (Polkadot testnet)
- **VM**: PolkaVM via pallet-revive
- **Address Format**: Ethereum (0x...)
- **ABI**: See `contract/solidity-abi.json`

### Key Contract Methods

- `storeMessage`: Store encrypted message metadata on-chain
- `getSentMessages`: Query messages sent by an address
- `getReceivedMessages`: Query messages received by an address
- `getMessage`: Retrieve specific message details

### Deploying Your Own Contract

See `contract/DEPLOYMENT_GUIDE.md` for complete deployment instructions using Hardhat.

Quick deployment:

```bash
cd contract
npm install
npx hardhat run scripts/deploy.js --network passetHub
```

Update `.env.local` with your deployed contract address.

## 🔑 Key Conversion Libraries

For developers working with Polkadot wallet keys:

### Ed25519/Sr25519 to X25519 Conversion

Polkadot wallets (like Talisman) use Ed25519 or Sr25519 keys for signing. To use these keys for encryption (X25519/ECDH), conversion is required.

**Recommended Libraries:**

- **@polkadot/util-crypto**: Official Polkadot utilities with key conversion functions
- **@noble/curves**: Modern, audited cryptography library
- **libsodium.js**: Comprehensive crypto library with conversion support

**Example Conversion (using @polkadot/util-crypto):**

```typescript
import { sr25519ToX25519 } from "@polkadot/util-crypto";

// Convert Sr25519 public key to X25519 for encryption
const x25519PublicKey = sr25519ToX25519(sr25519PublicKey);
```

See `docs/developer-guide.md` for detailed conversion steps and examples.

## 📅 Redeem Package Expiry Policies

### What are Redeem Packages?

Redeem packages allow sending messages to recipients who don't yet have a Polkadot wallet. The sender creates a package protected by a passphrase, which the recipient can claim later.

### Expiry Recommendations

**Default Expiry: 30 days**

- Redeem packages should have a reasonable expiry to limit exposure
- After expiry, the package CID may be unpinned from IPFS
- Recipients should claim packages promptly

**Best Practices:**

1. **Set Expiry**: Include expiration timestamp in redeem package metadata
2. **Notify Recipient**: Share the claim link and passphrase through separate channels
3. **Monitor Claims**: Check if package has been claimed before expiry
4. **Reissue if Needed**: Create a new package if the original expires unclaimed
5. **Document Expiry**: Clearly communicate expiry date to recipient

**Security Considerations:**

- Shorter expiry = less time for brute-force attacks on passphrase
- Longer expiry = more convenience for recipient
- Balance security and usability based on content sensitivity

**Implementation:**

```typescript
const redeemPackage = {
  // ... other fields
  expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  createdAt: Date.now(),
};
```

## 📚 Documentation

### Quick Start

- **[Passet Hub Quick Reference](PASSET_HUB_QUICK_REFERENCE.md)**: Essential commands and configuration
- **[Wallet Setup Guide](WALLET_SETUP_GUIDE.md)**: Configure MetaMask or Talisman
- **[Storacha Setup](docs/STORACHA_SETUP.md)**: Configure decentralized storage

### For Users

- **[User Guide](docs/user-guide.md)**: Step-by-step tutorials for using SovSeal
- **[FAQ](docs/user-guide.md#faq)**: Common questions and answers

### For Developers

- **[SovSeal Roadmap](docs/SOVSEAL_ROADMAP.md)**: Master roadmap for YC-ready transformation
- **[YC Roadmap](docs/YC_ROADMAP.md)**: Technical implementation roadmap
- **[Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)**: Step-by-step implementation details
- **[RPC Endpoints Reference](docs/RPC_ENDPOINTS.md)**: Complete guide to Passet Hub RPC endpoints
- **[Contract Deployment Guide](contract/DEPLOYMENT_GUIDE.md)**: Deploy Solidity contracts to Passet Hub
- **[Developer Guide](docs/developer-guide.md)**: API reference, architecture, and technical details
- **[Requirements](.kiro/specs/sovseal/requirements.md)**: Detailed requirements specification
- **[Design](.kiro/specs/sovseal/design.md)**: Architecture and design decisions

### Additional Resources

- **[RPC Endpoints](docs/RPC_ENDPOINTS.md)**: Complete RPC endpoint reference
- **[Error Handling](docs/ERROR_HANDLING_QUICK_REFERENCE.md)**: Error handling patterns
- **[Network Resilience](docs/NETWORK_RESILIENCE.md)**: Retry logic and timeout handling
- **[Testing Guide](docs/EDGE_CASE_TESTING.md)**: Testing strategies and edge cases

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built on [Polkadot](https://polkadot.network/) blockchain infrastructure (Passet Hub testnet)
- Smart contracts powered by [pallet-revive](https://github.com/paritytech/polkadot-sdk/tree/master/substrate/frame/revive) (PolkaVM)
- Storage powered by [Storacha Network](https://storacha.network/) (formerly Web3.Storage)
- Wallet integration via [Talisman](https://talisman.xyz/) and [MetaMask](https://metamask.io/)
- UI framework by [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/sovseal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/sovseal/discussions)
- **Email**: support@sovseal.com

---

**Remember: Your privacy is guaranteed by math, not corporations. SovSeal — The Sovereign Protocol for Digital Legacy.**

# FutureProof

**Guaranteed by math, not corporations**

A decentralized time-capsule application that enables users to create time-locked audio/video messages using client-side encryption, IPFS storage, and Polkadot blockchain.

## Features

- 🔐 Client-side encryption with AES-256-GCM
- 🌐 Decentralized storage via IPFS (Web3.Storage)
- ⛓️ Blockchain-enforced unlock conditions on Polkadot Westend
- 🎥 Record or upload audio/video messages
- 🔓 Time-locked message delivery
- 🦊 Talisman wallet integration

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Blockchain**: Polkadot.js API
- **Storage**: Web3.Storage (IPFS)
- **Wallet**: Talisman browser extension

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Talisman wallet browser extension
- Web3.Storage account (email-based authentication via Storacha w3up-client)
- Westend testnet tokens (from faucet)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd futureproof-app
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment template:

```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here
NEXT_PUBLIC_RPC_ENDPOINT=wss://westend-rpc.polkadot.io
NEXT_PUBLIC_NETWORK=westend

# Storacha (w3up-client) uses email-based authentication
# No API token required - see: https://web3.storage/docs/w3up-client/

# Optional: Pinata (alternative IPFS provider)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
NEXT_PUBLIC_PINATA_SECRET=your_pinata_secret_here

NEXT_PUBLIC_DEMO_MODE=false
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:

```bash
npm run build
npm start
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## Project Structure

```
futureproof-app/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Core services (encryption, IPFS, contracts)
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── public/           # Static assets
```

## Privacy Guarantees

- All encryption/decryption happens in your browser
- No plaintext media or keys ever leave your device
- Unlock conditions enforced by blockchain consensus
- Decentralized storage with no central authority

## Documentation

For detailed documentation, see:

- [Requirements](.kiro/specs/futureproof-app/requirements.md)
- [Design](.kiro/specs/futureproof-app/design.md)
- [Implementation Tasks](.kiro/specs/futureproof-app/tasks.md)

## License

MIT

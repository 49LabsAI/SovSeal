# @sovseal/sdk

The official TypeScript SDK for the **SovSeal Protocol** — build applications for decentralized digital legacy and time-locked media.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@sovseal/sdk.svg)](https://www.npmjs.com/package/@sovseal/sdk)

## Installation

```bash
npm install @sovseal/sdk ethers
# or
yarn add @sovseal/sdk ethers
```

## Quick Start

```typescript
import { SovSealClient, CryptoService } from '@sovseal/sdk';
import { ethers } from 'ethers';

// Initialize client
const client = new SovSealClient({
  rpcUrl: 'https://polkadot-asset-hub-eth-rpc.polkadot.io',
  contractAddress: '0x...',
});

// Read messages (no signer needed)
const messages = await client.getReceivedMessages('0x...');

// For write operations, connect a signer
const signer = await provider.getSigner();
client.connect(signer);

// Store a new message
const result = await client.storeMessage({
  encryptedKeyCid: 'bafybeig...',
  encryptedMessageCid: 'bafybeih...',
  messageHash: 'abc123...',
  unlockTimestamp: Math.floor(Date.now() / 1000) + 86400 * 365,
  recipient: '0x...',
});
```

## Encryption

The SDK includes a CryptoService for client-side AES-256-GCM encryption:

```typescript
import { CryptoService } from '@sovseal/sdk';

// Generate encryption key
const key = await CryptoService.generateAESKey();

// Encrypt data
const blob = new Blob(['Secret message for the future']);
const encrypted = await CryptoService.encryptBlob(blob, key);

// Convert to single blob for storage
const storageBlob = CryptoService.encryptedDataToBlob(encrypted);

// Later, decrypt
const encryptedData = await CryptoService.blobToEncryptedData(storageBlob);
const decrypted = await CryptoService.decryptBlob(encryptedData, key);
```

## API Reference

### SovSealClient

| Method | Description |
|--------|-------------|
| `connect(signer)` | Connect a signer for write operations |
| `storeMessage(params)` | Store a new time-locked message |
| `getSentMessages(address)` | Get all messages sent by an address |
| `getReceivedMessages(address)` | Get all messages received by an address |
| `getMessage(id)` | Get a specific message by ID |
| `getMessageCount()` | Get total message count |
| `isUnlockable(message)` | Check if message can be unlocked |
| `getTimeUntilUnlock(message)` | Get time remaining until unlock |

### CryptoService

| Method | Description |
|--------|-------------|
| `generateAESKey()` | Generate a new 256-bit AES key |
| `encryptBlob(blob, key)` | Encrypt data with AES-GCM |
| `decryptBlob(data, key)` | Decrypt data with AES-GCM |
| `exportKey(key)` | Export key to raw format |
| `importKey(data)` | Import key from raw format |
| `sha256(data)` | Calculate SHA-256 hash |

## Network Configuration

| Network | RPC URL | Chain ID |
|---------|---------|----------|
| Polkadot Asset Hub Mainnet | `https://polkadot-asset-hub-eth-rpc.polkadot.io` | 420420421 |
| Passet Hub Testnet | `https://testnet-passet-hub-eth-rpc.polkadot.io` | 420420422 |

## License

Apache-2.0 — See [LICENSE](./LICENSE) for details.

## Links

- [Website](https://sovseal.io)
- [Documentation](https://docs.sovseal.io)
- [Smart Contracts](https://github.com/sovseal/contracts)

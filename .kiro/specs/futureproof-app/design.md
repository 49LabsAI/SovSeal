# FutureProof Design Document

## Overview

FutureProof is a decentralized time-capsule application built with Next.js that enables users to create time-locked audio/video messages. The application prioritizes privacy through client-side encryption, decentralized storage via IPFS, and blockchain-enforced unlock conditions on Polkadot's Westend testnet.

The core principle is "Guaranteed by math, not corporations" - no plaintext media or encryption keys ever leave the user's browser, and all unlock conditions are enforced by blockchain consensus rather than centralized servers.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client-Side)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Next.js Application                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   UI Layer   │  │ Crypto Layer │  │ Wallet Layer │ │ │
│  │  │  (React)     │  │ (Web Crypto) │  │ (Talisman)   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ Media Layer  │  │ Storage Layer│  │Contract Layer│ │ │
│  │  │(MediaRecorder│  │ (IPFS Client)│  │(Polkadot.js) │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Web3.Storage │    │   Polkadot   │    │   Talisman   │
│   (IPFS)     │    │   Westend    │    │    Wallet    │
│              │    │   Testnet    │    │  Extension   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Technology Stack

- **Frontend Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+ with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Wallet Integration**: @polkadot/extension-dapp, @polkadot/api
- **Blockchain**: Polkadot.js API for Westend testnet interaction
- **Storage**: Web3.Storage SDK for IPFS uploads (with Pinata fallback)
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Media**: MediaRecorder API for recording
- **State Management**: React Context + hooks
- **Deployment**: Vercel with CI/CD via GitHub Actions

## Components and Interfaces

### 1. Wallet Connection Module

**Purpose**: Manage Talisman wallet connection and authentication

**Key Components**:
- `WalletProvider`: React context for wallet state
- `WalletConnectButton`: UI component for connection
- `useWallet`: Custom hook for wallet operations

**Interfaces**:
```typescript
interface WalletState {
  isConnected: boolean;
  address: string | null;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  selectAccount: (address: string) => void;
  signMessage: (message: string) => Promise<string>;
}
```

**Key Functions**:
- Detect Talisman extension presence
- Request wallet connection
- Persist connection state in localStorage
- Handle account selection
- Sign transactions and messages

### 2. Media Capture Module

**Purpose**: Record or upload audio/video content

**Key Components**:
- `MediaRecorder`: Component for recording
- `MediaUploader`: Component for file uploads
- `MediaPreview`: Preview recorded/uploaded media

**Interfaces**:
```typescript
interface MediaConfig {
  type: 'audio' | 'video';
  mimeType: string;
  maxSize: number; // 100MB
}

interface RecordingState {
  isRecording: boolean;
  duration: number;
  blob: Blob | null;
  stream: MediaStream | null;
}

interface MediaFile {
  blob: Blob;
  type: 'audio' | 'video';
  size: number;
  mimeType: string;
}
```

**Key Functions**:
- Request microphone/camera permissions
- Start/stop recording with MediaRecorder API
- Handle file uploads with validation
- Support formats: MP3, WAV, OGG, MP4, WEBM, MOV
- Implement chunked upload for files >50MB

### 3. Encryption Module

**Purpose**: Client-side encryption/decryption using Web Crypto API

**Key Components**:
- `CryptoService`: Core encryption service
- `KeyManager`: AES key generation and management

**Interfaces**:
```typescript
interface EncryptedData {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
  algorithm: 'AES-GCM';
  keyLength: 256;
}

interface EncryptedKey {
  encryptedAESKey: ArrayBuffer;
  recipientPublicKey: string;
}
```

**Key Functions**:
- Generate unique 256-bit AES keys per message
- Encrypt media blobs using AES-256-GCM
- Encrypt AES keys with recipient's public key (RSA-OAEP or X25519)
- Decrypt AES keys using recipient's private key (via Talisman)
- Decrypt media blobs for playback
- Secure memory cleanup after operations

**Encryption Flow**:
1. Generate random AES-256 key
2. Encrypt media blob with AES-GCM (includes IV)
3. Obtain recipient's public key from Talisman API or on-chain
4. Encrypt AES key with recipient's public key
5. Upload encrypted AES key to IPFS
6. Upload encrypted media blob to IPFS
7. Clear AES key from memory

### 4. IPFS Storage Module

**Purpose**: Upload encrypted content to decentralized storage

**Key Components**:
- `IPFSService`: Web3.Storage integration
- `PinataFallback`: Backup pinning service
- `UploadProgress`: Progress tracking component

**Interfaces**:
```typescript
interface IPFSUploadResult {
  cid: string;
  size: number;
  provider: 'web3.storage' | 'pinata';
}

interface UploadOptions {
  onProgress?: (progress: number) => void;
  chunked?: boolean;
  chunkSize?: number;
}
```

**Key Functions**:
- Upload encrypted blobs to Web3.Storage
- Fallback to Pinata on failure
- Track upload progress
- Handle chunked uploads for large files
- Return IPFS CID for retrieval
- Verify automatic pinning across nodes

> **After upload, IPFSService SHALL verify CID accessibility (attempt retrieval); on failure or missing pin confirmation, retry or invoke Pinata fallback and surface the state to the user.**

### 5. Smart Contract Module

**Purpose**: Interact with Polkadot testnet contract for metadata storage

**Key Components**:
- `ContractService`: Contract interaction layer
- `ContractABI`: Type-safe contract interface
- `TransactionManager`: Transaction handling

**Interfaces**:
```typescript
interface MessageMetadata {
  encryptedKeyCID: string;
  encryptedMessageCID: string;
  messageHash: string;
  unlockTimestamp: number;
  sender: string;
  recipient: string;
  createdAt: number;
}

interface ContractConfig {
  contractAddress: string;
  rpcEndpoint: string;
  network: 'westend' | 'rococo';
}
```

**Key Functions**:
- Connect to Westend testnet via Polkadot.js
- Submit message metadata transactions
- Query sent messages by sender address
- Query received messages by recipient address
- Handle transaction signing via Talisman
- Provide faucet guidance on transaction failures
- Support environment-based contract switching

**Contract Methods** (ink! smart contract):
```rust
// Simplified contract interface
#[ink(message)]
pub fn store_message(
    encrypted_key_cid: String,
    encrypted_message_cid: String,
    message_hash: String,
    unlock_timestamp: u64,
    recipient: AccountId,
) -> Result<MessageId>;

#[ink(message)]
pub fn get_sent_messages(sender: AccountId) -> Vec<MessageMetadata>;

#[ink(message)]
pub fn get_received_messages(recipient: AccountId) -> Vec<MessageMetadata>;
```

### 6. Dashboard Module

**Purpose**: Display sent and received messages with status

**Key Components**:
- `Dashboard`: Main dashboard container
- `SentMessages`: List of sent messages
- `ReceivedMessages`: List of received messages
- `MessageCard`: Individual message display
- `StatusBadge`: Visual status indicator

**Interfaces**:
```typescript
interface Message {
  id: string;
  encryptedKeyCID: string;
  encryptedMessageCID: string;
  messageHash: string;
  unlockTimestamp: number;
  sender: string;
  recipient: string;
  status: MessageStatus;
  createdAt: number;
}

type MessageStatus = 'Locked' | 'Unlockable' | 'Unlocked';

interface DashboardFilters {
  status?: MessageStatus;
  dateRange?: { start: Date; end: Date };
}
```

**Key Functions**:
- Query blockchain for user's messages
- Calculate and display status based on current time
- Real-time status updates as timestamps pass
- Filter and sort messages
- Navigate to unlock/playback interface

### 7. Unlock and Playback Module

**Purpose**: Decrypt and play unlocked messages

**Key Components**:
- `UnlockFlow`: Timestamp verification and decryption
- `MediaPlayer`: Secure media playback
- `PlaybackControls`: Standard media controls

**Interfaces**:
```typescript
interface UnlockRequest {
  messageId: string;
  encryptedKeyCID: string;
  encryptedMessageCID: string;
  unlockTimestamp: number;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  mediaUrl: string | null;
}
```

**Key Functions**:
- Verify current time >= unlock timestamp
- Download encrypted AES key from IPFS
- Decrypt AES key using Talisman wallet
- Download encrypted media from IPFS
- Decrypt media blob in memory
- Create object URL for playback
- Provide play/pause/seek/volume controls
- Revoke object URLs on close
- Clear decrypted data from memory
- Support demo mode for simulated unlocks

### 8. Recipient Without Wallet Module

**Purpose**: Handle messages for recipients without wallets

**Key Components**:
- `RedeemPackageGenerator`: Create claim packages
- `ClaimInterface`: Recipient claim flow

**Interfaces**:
```typescript
interface RedeemPackage {
  encryptedKeyCID: string;
  encryptedMessageCID: string;
  messageHash: string;
  unlockTimestamp: number;
  instructions: string;
  packageCID: string;
}

interface ClaimLink {
  url: string;
  packageCID: string;
  expiresAt?: number;
}
```

**Key Functions**:
- Generate temporary public/private key pair
- Encrypt AES key with temporary public key
- Create redeem package with instructions
- Upload package to IPFS
- Generate shareable claim link
- Provide claim interface for recipients
- Import package after wallet setup

> The redeem package SHALL include an expiration timestamp and be stored encrypted on Web3.Storage; the claim link is a CID-based URL and implementers should document recommended expiry and reissue policies in the README to reduce exposure risk.

> CLAIM NOTE: The redeem package SHALL include the encrypted AES key and a sender-chosen passphrase shared off-chain; the recipient uses the passphrase to decrypt the package after wallet setup, avoiding server-held temporary private keys.

## Data Models

### Message Entity
```typescript
interface Message {
  id: string;
  encryptedKeyCID: string;
  encryptedMessageCID: string;
  messageHash: string; // SHA-256 of the encrypted media blob
  unlockTimestamp: number;
  sender: string;
  recipient: string;
  status: MessageStatus;
  createdAt: number;
  metadata?: {
    fileSize: number;
    mimeType: string;
    duration?: number;
  };
}
```

> **messageHash SHALL be the SHA-256 of the encrypted media blob; clients SHALL verify SHA-256 matches before attempting decryption.**

### User Session
```typescript
interface UserSession {
  walletAddress: string;
  connectedAt: number;
  lastActivity: number;
  preferences: {
    defaultRecordingMode: 'audio' | 'video';
    autoConnect: boolean;
  };
}
```

### Encryption Metadata
```typescript
interface EncryptionMetadata {
  algorithm: 'AES-GCM';
  keyLength: 256;
  ivLength: 12;
  tagLength: 16;
  publicKeyAlgorithm: 'RSA-OAEP' | 'X25519';
}
```

> NOTE: Choose one asymmetric algorithm for AES key encryption and document it here. Recommended: use X25519 (Curve25519) for ephemeral ECDH-derived symmetric wrapping keys; if using Ed25519/Sr25519 keys from Talisman, include conversion steps in developer docs.

> IMPLEMENTATION NOTE: Converting Polkadot wallet keys (Ed25519/Sr25519) to an X25519/ECDH wrapping key requires explicit conversion steps; document the chosen method and recommended libs (e.g. @polkadot/util-crypto, @noble/curves) in developer docs.

## Error Handling

### Error Categories

1. **Wallet Errors**
   - Extension not installed → Display installation instructions
   - Connection rejected → Allow retry
   - Account selection cancelled → Return to connect screen
   - Transaction signing failed → Show error with retry option

2. **Media Errors**
   - Permission denied → Request permissions with explanation
   - Recording failed → Display error and allow retry
   - File too large → Show size warning and suggest compression
   - Unsupported format → List supported formats

3. **Encryption Errors**
   - Key generation failed → Retry with fallback
   - Encryption failed → Clear state and allow retry
   - Decryption failed → Verify key and retry
   - Memory allocation failed → Suggest smaller file

4. **Storage Errors**
   - Web3.Storage upload failed → Fallback to Pinata
   - Pinata upload failed → Display error and allow retry
   - IPFS retrieval failed → Retry with exponential backoff
   - Network timeout → Show retry option

5. **Blockchain Errors**
   - Contract not found → Verify contract address
   - Transaction failed → Show error with faucet link
   - Insufficient funds → Provide faucet instructions
   - Network unavailable → Check connection and retry
   - Query failed → Retry with exponential backoff

6. **Unlock Errors**
   - Timestamp not reached → Display countdown
   - Key decryption failed → Verify wallet access
   - Media decryption failed → Verify data integrity
   - Playback failed → Check browser compatibility

### Error Recovery Strategies

- Automatic retry with exponential backoff for network errors
- Fallback providers (Pinata for IPFS)
- Clear error messages with actionable guidance
- Transaction failure guidance with faucet links
- State recovery from localStorage where applicable

## Testing Strategy

### Unit Tests
- Encryption/decryption functions
- Key generation and management
- IPFS upload/download logic
- Contract interaction methods
- Timestamp validation
- Status calculation logic

### Integration Tests
- Wallet connection flow
- End-to-end message creation
- Message retrieval and decryption
- Dashboard data loading
- Unlock flow with timestamp verification

### E2E Tests (Playwright/Cypress)
- Complete user journey: connect → record → encrypt → send
- Recipient journey: connect → view → unlock → play
- Error scenarios and recovery
- Demo mode functionality
- Responsive design on mobile/desktop

### Security Tests
- Verify no plaintext leakage
- Confirm key cleanup after operations
- Test encryption strength
- Validate timestamp enforcement
- Check object URL revocation

### Manual Testing Checklist
- Talisman wallet integration
- Media recording on different browsers
- File upload with various formats
- IPFS upload and retrieval
- Blockchain transaction submission
- Dashboard real-time updates
- Playback controls functionality
- Demo mode toggle

## Security Considerations

### Client-Side Security
- All encryption/decryption happens in browser memory
- AES keys never transmitted in plaintext
- Immediate memory cleanup after operations
- Object URLs revoked after playback
- No localStorage for sensitive data
- Content Security Policy headers

### Blockchain Security
- Timestamp enforcement via smart contract
- Immutable metadata on-chain
- Recipient verification before decryption
- Transaction signing via Talisman
- No private keys handled by application

### Storage Security
- Only encrypted data uploaded to IPFS
- CIDs are content-addressed (tamper-proof)
- Encrypted AES keys separate from encrypted media
- No centralized key storage

### Key Management
- Unique AES key per message
- Keys encrypted with recipient's public key
- Private keys remain in Talisman wallet
- No key reuse or derivation patterns

## Performance Considerations

### Optimization Strategies
- Lazy load dashboard messages (pagination)
- Stream large file uploads (chunking)
- Cache IPFS gateway responses
- Debounce blockchain queries
- Optimize bundle size with code splitting
- Use Web Workers for encryption (if needed)

### Resource Limits
- 100MB max file size
- Chunked upload for files >50MB
- Memory cleanup after operations
- Limit concurrent IPFS uploads
- Rate limiting for blockchain queries

## Deployment Architecture

### Vercel Deployment
- Static site generation where possible
- Edge functions for API routes (if needed)
- Environment variables for contract addresses
- Automatic deployments from main branch
- Preview deployments for PRs

### Environment Configuration
```
NEXT_PUBLIC_CONTRACT_ADDRESS=<contract_address>
NEXT_PUBLIC_RPC_ENDPOINT=wss://westend-rpc.polkadot.io
NEXT_PUBLIC_NETWORK=westend

# Storacha (w3up-client) uses email-based authentication
# No API token required - authentication via email or delegation

# Optional: Pinata (alternative IPFS provider)
NEXT_PUBLIC_PINATA_API_KEY=<key>
NEXT_PUBLIC_PINATA_SECRET=<secret>

NEXT_PUBLIC_DEMO_MODE=false
```

### CI/CD Pipeline
1. GitHub Actions on push/PR
2. Run linting and type checking
3. Run unit and integration tests
4. Build Next.js application
5. Deploy to Vercel
6. Run E2E tests on preview deployment
7. Merge to main triggers production deployment

## Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus indicators on interactive elements
- ARIA labels for dynamic content
- Captions/transcripts for demo videos

## Browser Compatibility

- Chrome/Edge 90+ (recommended)
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires Web Crypto API support
- Requires MediaRecorder API support
- Talisman extension required (desktop)

> Note: Desktop Talisman extension is required for full functionality; mobile wallet support (WalletConnect or Talisman mobile) is out of scope for the hackathon MVP and must be documented as a limitation.

> Note: MediaRecorder support on iOS Safari is limited; provide an upload-only fallback and document which iOS versions are supported.

## Future Enhancements

- Multi-chain support via XCM
- Batch message sending
- Message scheduling
- Encrypted text messages
- Group messages with multiple recipients
- Message expiration/auto-delete
- Paid storage options for permanence
- Mobile app (React Native)
- Message templates
- Notification system for unlocks

## Demo Mode

For hackathon presentations and testing:

- Environment variable `NEXT_PUBLIC_DEMO_MODE=true`
- Bypass timestamp verification
- Clearly labeled "DEMO MODE" banner
- Simulated unlock flow
- Disabled in production builds
- Separate demo contract on testnet

## Documentation Requirements

### README.md
- Project overview and tagline
- Architecture diagram
- Setup instructions
- Environment variables
- Contract deployment guide
- Faucet links for Westend tokens
- Privacy guarantees explanation
- Key backup warnings
- Fallback contract approach
- Web3.Storage free-tier limitations
- Long-term storage options
- Export procedure for encrypted CIDs

### Developer Documentation
- API reference for modules
- Contract ABI documentation
- Encryption flow diagrams
- Testing guide
- Deployment guide
- Troubleshooting common issues

### User Documentation
- How to connect Talisman wallet
- How to create time-locked messages
- How to unlock and view messages
- Key backup importance
- Privacy features explanation
- FAQ section

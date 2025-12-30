# Redeem Package Service

Service for creating and managing redeem packages for recipients without wallets.

## Overview

The Redeem Package Service enables senders to create passphrase-protected packages that allow recipients to claim time-locked messages after setting up a Talisman wallet. This solves the problem of sending messages to recipients who don't yet have a wallet.

## Architecture

### Flow

1. **Sender creates redeem package:**
   - Generates redeem package with message metadata
   - Encrypts package with passphrase using PBKDF2 + AES-256-GCM
   - Uploads encrypted package to IPFS
   - Receives claim link with package CID

2. **Sender shares with recipient:**
   - Shares claim link through one channel
   - Shares passphrase through a separate, secure channel

3. **Recipient claims message:**
   - Visits claim link
   - Installs Talisman wallet (if needed)
   - Enters passphrase to decrypt package
   - Package saved to localStorage for dashboard access

## Security

### Encryption

- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Encryption:** AES-256-GCM
- **Salt:** 16 random bytes per package
- **IV:** 12 random bytes per encryption

### Best Practices

- Passphrase must be at least 8 characters
- Link and passphrase should be shared through separate channels
- Packages include expiration timestamps (default: 30 days)
- No server-side key storage - all encryption is client-side

## API Reference

### RedeemPackageService

#### createRedeemPackage()

Creates a redeem package with message metadata.

```typescript
static createRedeemPackage(
  encryptedKeyCID: string,
  encryptedMessageCID: string,
  messageHash: string,
  unlockTimestamp: number,
  sender: string,
  expirationDays: number = 30
): RedeemPackage
```

#### encryptRedeemPackage()

Encrypts a redeem package with a passphrase.

```typescript
static async encryptRedeemPackage(
  redeemPackage: RedeemPackage,
  passphrase: string
): Promise<EncryptedRedeemPackage>
```

#### decryptRedeemPackage()

Decrypts a redeem package with a passphrase.

```typescript
static async decryptRedeemPackage(
  encryptedPackage: EncryptedRedeemPackage,
  passphrase: string
): Promise<DecryptedRedeemPackage>
```

#### serializeEncryptedPackage()

Serializes an encrypted package for IPFS upload.

```typescript
static serializeEncryptedPackage(
  encryptedPackage: EncryptedRedeemPackage
): Blob
```

#### deserializeEncryptedPackage()

Deserializes an encrypted package from IPFS download.

```typescript
static async deserializeEncryptedPackage(
  blob: Blob
): Promise<EncryptedRedeemPackage>
```

#### generateClaimLink()

Generates a claim link for a redeem package.

```typescript
static generateClaimLink(
  packageCID: string,
  baseUrl: string,
  expiresAt?: number
): ClaimLink
```

## Data Format

### Serialized Package Structure

```
[16 bytes: salt][12 bytes: iv][remaining: encrypted data]
```

### Encrypted Data (JSON)

```json
{
  "encryptedKeyCID": "bafybeiabc...",
  "encryptedMessageCID": "bafybeiabc...",
  "messageHash": "sha256hash...",
  "unlockTimestamp": 1234567890000,
  "sender": "5GrwvaEF...",
  "instructions": "Instructions for recipient...",
  "expiresAt": 1234567890000
}
```

## Error Handling

- **Invalid passphrase:** Throws "Invalid passphrase or corrupted package"
- **Expired package:** Throws "This redeem package has expired"
- **Short passphrase:** Throws "Passphrase must be at least 8 characters long"

## Requirements

Implements requirement 6.6: Recipient-without-wallet flow

## Usage Example

```typescript
import { RedeemPackageService } from "@/lib/redeem";
import { IPFSService } from "@/lib/storage";

// Create and encrypt package
const redeemPackage = RedeemPackageService.createRedeemPackage(
  "bafybeiabc...",
  "bafybeiabc...",
  "sha256hash...",
  Date.now() + 86400000,
  "5GrwvaEF..."
);

const encryptedPackage = await RedeemPackageService.encryptRedeemPackage(
  redeemPackage,
  "my-secure-passphrase"
);

// Upload to IPFS
const packageBlob =
  RedeemPackageService.serializeEncryptedPackage(encryptedPackage);
const { cid } = await IPFSService.uploadFile(packageBlob);

// Generate claim link
const claimLink = RedeemPackageService.generateClaimLink(
  cid,
  "https://sovseal.app"
);

console.log("Share this link:", claimLink.url);
console.log("Share this passphrase separately:", "my-secure-passphrase");
```

## Future Enhancements

- Support for multiple recipients
- Configurable PBKDF2 iterations
- Alternative key derivation functions (Argon2)
- Package reissue/renewal functionality
- Email-based claim notifications

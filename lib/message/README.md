# Message Creation Module

This module orchestrates the end-to-end creation of time-locked vaults in the SovSeal application.

## Overview

The `MessageCreationService` handles the complete flow of creating a time-locked message:

1. **Encryption**: Generate AES-256 key and encrypt media blob
2. **Hashing**: Calculate SHA-256 hash of encrypted blob for integrity verification
3. **Key Encryption**: Retrieve recipient's public key and encrypt AES key
4. **IPFS Upload**: Upload encrypted AES key and encrypted media to IPFS
5. **Blockchain**: Submit transaction to Polkadot smart contract
6. **Cleanup**: Securely clear sensitive data from memory

## Usage

```typescript
import { MessageCreationService } from "@/lib/message";

// Create a time-locked message
const result = await MessageCreationService.createMessage(
  {
    mediaFile: mediaFile,
    recipientAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    unlockTimestamp: Date.now() + 86400000, // 24 hours from now
    senderAccount: selectedAccount,
  },
  (progress) => {
    console.log(`${progress.stage}: ${progress.progress}%`);
  }
);

if (result.success) {
  console.log("Message created:", result.messageId);
} else {
  console.error("Error:", result.error);
}
```

## Progress Stages

The service reports progress through the following stages:

- `encrypting`: Generating AES key and encrypting media
- `hashing`: Calculating SHA-256 hash
- `key-encryption`: Encrypting AES key with recipient's public key
- `uploading-key`: Uploading encrypted key to IPFS
- `uploading-media`: Uploading encrypted media to IPFS
- `submitting`: Submitting transaction to blockchain
- `complete`: Message creation complete

## Security Features

- **Client-side encryption**: All encryption happens in the browser
- **Unique keys**: Each message uses a unique AES-256 key
- **Secure cleanup**: Sensitive data is overwritten in memory after use
- **Integrity verification**: SHA-256 hash ensures data hasn't been tampered with
- **Blockchain anchoring**: Unlock conditions enforced by smart contract

## Requirements Satisfied

- 4.1: Generate unique 256-bit AES key
- 4.2: Encrypt media blob using AES-256-GCM
- 4.3: Create encrypted blob with IV
- 4.4: No plaintext transmitted outside browser
- 4.5: Secure memory cleanup
- 5.1: Upload to Web3.Storage
- 5.2: Return IPFS CID
- 6.1: Retrieve recipient's public key
- 6.2: Submit transaction to contract
- 6.3: Request transaction signing
- 6.4: Display success confirmation

## Error Handling

The service handles various error scenarios:

- Invalid parameters (validation before processing)
- Encryption failures
- IPFS upload failures (with retry logic)
- Blockchain transaction failures (with faucet guidance)
- Network errors (with retry logic in underlying services)

All errors are caught and returned in the result object with descriptive messages.

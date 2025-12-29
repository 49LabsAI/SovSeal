# Storage Services

## Overview

SovSeal supports multiple IPFS storage providers with a unified interface. The storage layer handles encrypted blob uploads and downloads with automatic retry logic, progress tracking, and CID verification.

## Available Services

### Storacha Network (Primary)

**Modern IPFS storage with email-based authentication**

- Email authentication - No API keys to manage
- UCAN delegation - User-controlled authorization
- Space-based organization - Content namespaced by DIDs
- CDN-level speeds - Optimized gateway performance
- 99.9% availability - Redundant storage with cryptographic proofs
- Browser-native - Fully compatible with client-side JavaScript
- Free tier - 5GB storage + egress per month
- Centralized logging via ErrorLogger
- Retry logic with exponential backoff via `withRetry()`

**When to use:**

- All implementations (recommended)
- Production deployments
- When you need reliable, fast IPFS storage
- When you want email-based user authentication

### Backward Compatibility

The `ipfsService` and `IPFSService` exports are aliases to `storachaService` for backward compatibility. All existing code using these exports will continue to work without changes.

## Service Selection

The active service is controlled by the `USE_MOCK` flag in `lib/storage/index.ts`.

## Usage Examples

### Using Storacha Service (Recommended)

```typescript
import { StorachaService } from "@/lib/storage";

// 1. Authenticate with email
await StorachaService.login("user@example.com");

// 2. Create a space
const spaceDid = await StorachaService.createSpace("my-messages");

// 3. Upload encrypted blob
const result = await StorachaService.uploadFile(encryptedBlob, "message.enc");

// 4. Download encrypted blob
const blob = await StorachaService.downloadFile(result.cid);
```

## Migration Guide

### From Legacy Web3.Storage to Storacha

**Step 1: Update imports**

```typescript
// BEFORE
import { IPFSService } from "@/lib/storage";

// AFTER
import { StorachaService } from "@/lib/storage";
```

**Step 2: Add authentication flow**

```typescript
await StorachaService.login("user@example.com");
await StorachaService.createSpace("my-space");
```

**Step 3: Update upload/download calls** (same interface!)

## Resources

- **Storacha Docs**: https://docs.storacha.network/
- **JS Client Guide**: https://docs.storacha.network/js-client/
- **Discord**: https://discord.gg/8uza4ha73R

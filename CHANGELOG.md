# Changelog

All notable changes to SovSeal will be documented in this file.

## [2.0.0] - 2025-12-29

### Brand Transformation

- 🎨 **Rebranded from Lockdrop to SovSeal** (Sovereign Seal)
- 🎯 **New positioning**: From consumer novelty to institutional-grade protocol
- 🎨 **New visual identity**: Deep Navy (#102a43), Gold (#d4af37), Slate Grey (#64748b)
- ✏️ **New typography**: Playfair Display (serif headings), Inter (body)
- 📝 **New tagline**: "The Sovereign Protocol for Digital Legacy"
- 🎯 **New value proposition**: Selling Admissibility, Security, and Finality

### Documentation

- ✅ Created comprehensive `docs/SOVSEAL_ROADMAP.md` with technical objectives
- ✅ Updated `docs/YC_ROADMAP.md` with SovSeal branding
- ✅ Updated `docs/IMPLEMENTATION_GUIDE.md` with SovSeal branding
- ✅ Updated `README.md` with new brand identity and product concepts
- ✅ Updated `.kiro/steering/product.md` with target personas

### Product Concepts

- 🏛️ **The Vault**: Digital Wills with social recovery and multi-heir designation
- 🛡️ **The Shield**: Whistleblower deterrence with dead man's switch
- 📜 **The Escrow**: B2B asset handover with integrity proofs

---

## [1.0.2] - 2025-11-30

### Improved

- ✅ Centralized logging with `ErrorLogger` - debug/info/warn/error levels with environment-based filtering
- ✅ Consolidated retry logic using `withRetry()` utility - reduced ~350 lines of duplicated code
- ✅ Health checks now pause when browser tab is hidden (visibility API) - better battery life
- ✅ Toast animations use `onTransitionEnd` instead of setTimeout - smoother UX
- ✅ Enhanced `withRetry()` with context support and improved error messages

### Removed

- Removed deprecated `IPFSService.ts` - backward compatibility maintained via index.ts aliases

### Technical Debt

- Reduced `any` type usages from 15+ to 5-7
- Eliminated all direct `console.*` calls in service files
- Removed all polling without visibility API optimization

---

## [1.0.1] - 2025-11-19

### Improved

- ✅ Wallet connections now persist across page refreshes and browser restarts
- ✅ Storacha authentication persists - no need to re-verify email
- ✅ Added visual connection status indicators
- ✅ Better error handling with clear recovery steps
- ✅ Partial state recovery for interrupted authentication flows

### Fixed

- Fixed wallet disconnecting on every page refresh
- Fixed Storacha authentication breaking if interrupted
- Fixed users having to reconnect multiple times unnecessarily

---

## [1.0.0] - 2025-11-17

### Added

- ✅ Complete end-to-end encrypted time-capsule messaging
- ✅ Talisman wallet integration (recommended) with MetaMask support
- ✅ Storacha Network (IPFS) for decentralized storage
- ✅ Passet Hub testnet (Polkadot) smart contract integration
- ✅ Client-side AES-256-GCM encryption
- ✅ RSA-OAEP key encryption with wallet signatures
- ✅ Video/audio message support with automatic format detection
- ✅ Real-time message status tracking (Locked/Unlockable/Unlocked)
- ✅ Dashboard with filtering and pagination
- ✅ Secure media player with automatic cleanup

### Security

- All encryption/decryption happens client-side
- Private keys never leave the user's wallet
- Encrypted content stored on IPFS (unreadable without keys)
- Unlock conditions enforced by blockchain consensus
- Automatic memory cleanup after viewing

### Technical Stack

- **Frontend**: Next.js 14 with TypeScript
- **Blockchain**: Passet Hub (Polkadot ecosystem) via Ethereum RPC
- **Storage**: Storacha Network (IPFS + Filecoin)
- **Wallet**: Talisman (recommended) or MetaMask
- **Encryption**: Web Crypto API (AES-256-GCM, RSA-OAEP)

### Known Issues

- Messages created before v1.0.0 may not have mime type metadata
- Hot reload during development may cause blob URL issues (refresh to fix)

### Migration Notes

- **Wallet**: Now uses EIP-1193 standard (Ethereum addresses only)
- **Storage**: Mime type now stored with encrypted key for proper playback
- **Status**: Message viewed status tracked in localStorage

---

## Development History

### November 16-17, 2025

- Migrated from Polkadot extension to EIP-1193 (Ethereum) wallet standard
- Fixed address type issues in MessageCreationService
- Implemented mime type storage and detection
- Fixed blob URL cleanup timing issues
- Prioritized Talisman as recommended wallet
- Added comprehensive error handling and troubleshooting

### Earlier Development

- Initial implementation with Polkadot.js
- Smart contract deployment to Passet Hub
- Storacha integration for IPFS storage
- Encryption and key management implementation

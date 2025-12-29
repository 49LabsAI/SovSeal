# Project Structure

## Directory Organization

```
sovseal/
├── app/              # Next.js App Router pages and layouts
├── components/       # React components (organized by feature)
├── lib/              # Core services and business logic
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── contract/         # Solidity smart contracts
└── public/           # Static assets
```

## Key Directories

### `/app` - Next.js App Router

- `layout.tsx` - Root layout with WalletProvider
- `page.tsx` - Home page
- `globals.css` - Global styles and Tailwind directives

### `/components` - React Components

Organized by feature/domain:

- `wallet/` - Wallet-related UI components
  - `WalletConnectButton.tsx`
  - `AccountSelector.tsx`
  - `KeyBackupWarning.tsx`

### `/lib` - Core Services

Business logic and service layers:

- `crypto/` - Encryption services
  - `CryptoService.ts` - AES-256-GCM encryption/decryption
  - `AsymmetricCrypto.ts` - RSA-OAEP key encryption
  - `index.ts` - Barrel export
- `wallet/` - Wallet integration
  - `WalletProvider.tsx` - React context for wallet state

### `/types` - TypeScript Definitions

Shared type definitions:

- `wallet.ts` - Wallet-related interfaces

### `/hooks` - Custom React Hooks

Reusable React hooks for common patterns

### `/utils` - Utility Functions

Pure utility functions and helpers

## Code Organization Patterns

### Client Components

- Use `'use client'` directive for components that need browser APIs
- Required for: wallet interactions, Web Crypto API, localStorage

### Service Classes

- Static methods for stateless services (e.g., `CryptoService`)
- Comprehensive JSDoc comments with requirement references
- Explicit error handling with descriptive messages

### Context Providers

- Wrap in WalletProvider at root layout level
- Custom hooks (e.g., `useWallet()`) for consuming context
- Throw errors if used outside provider

### Import Aliases

- Use `@/` prefix for absolute imports from project root
- Example: `import { CryptoService } from '@/lib/crypto'`

### Dynamic Imports

- Use dynamic imports for Polkadot extension to avoid SSR issues
- Example: `const { web3Enable } = await import('@polkadot/extension-dapp')`

## File Naming Conventions

- React components: PascalCase (e.g., `WalletProvider.tsx`)
- Services/utilities: PascalCase for classes, camelCase for functions
- Types: camelCase for files, PascalCase for interfaces/types
- Use `.tsx` for files with JSX, `.ts` for pure TypeScript

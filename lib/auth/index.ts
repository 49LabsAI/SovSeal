/**
 * Auth module - Privy SDK integration for frictionless onboarding
 *
 * Provides:
 * - Passkey authentication (FaceID/TouchID)
 * - Email/social login
 * - Embedded wallets
 * - Unified wallet interface
 */

export { PrivyProvider } from "./PrivyProvider";
export { usePrivyWallet, type PrivyWalletState } from "./usePrivyWallet";
export {
  UnifiedWalletProvider,
  useUnifiedWallet,
  type WalletMode,
  type UnifiedWalletState,
  type UnifiedWalletContextValue,
} from "./UnifiedWalletProvider";
export { usePrivySync } from "./usePrivySync";
export { PrivyWalletBridge } from "./PrivyWalletBridge";

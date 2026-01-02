/**
 * Recovery Module - Social Recovery for SovSeal
 *
 * Implements Shamir's Secret Sharing (SSS) for key splitting
 * and guardian-based recovery.
 */

export { ShamirService } from "./ShamirService";
export { GuardianManager } from "./GuardianManager";
export { RecoveryOrchestrator } from "./RecoveryOrchestrator";
export type {
    Guardian,
    GuardianInput,
    GuardianType,
    GuardianStatus,
    RecoveryConfig,
    RecoverySession,
    RecoveryStatus,
    RecoveryRequest,
    RecoveryResult,
    ShareSubmission,
    SplitResult,
} from "./types";

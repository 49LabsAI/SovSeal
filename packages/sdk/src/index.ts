/**
 * @license Apache-2.0
 * Copyright 2025-2026 SovSeal Protocol Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SovSeal SDK - TypeScript client for the SovSeal Protocol
 *
 * This is the official SDK for building applications on top of the
 * SovSeal Protocol for decentralized digital legacy and time-locked media.
 */

export { SovSealClient } from "./client";
export type { SovSealClientConfig, MessageMetadata, CreateMessageParams } from "./types";
export { CryptoService } from "./crypto";
export type { EncryptedData, EncryptionMetadata } from "./crypto";

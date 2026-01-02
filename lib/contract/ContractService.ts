/**
 * ContractService - Ethereum-compatible smart contract interaction layer
 *
 * Handles connection to Passet Hub testnet via Ethereum RPC and provides methods for
 * interacting with the SovSeal time-lock Solidity contract.
 *
 * Features:
 * - Multi-RPC fallback for improved reliability
 * - Automatic endpoint rotation on failure
 * - Connection health monitoring
 *
 * Uses ethers.js for Ethereum-compatible contract interactions on Polkadot infrastructure.
 */

"use client";

import { ethers } from "ethers";
import { withTimeout, TIMEOUTS } from "@/utils/timeout";
import { withRetry } from "@/utils/retry";
import { ErrorLogger } from "@/lib/monitoring/ErrorLogger";
import { getRpcEndpoints, getCurrentNetwork } from "@/lib/config/networks";
import solidityAbi from "@/contract/solidity-abi.json";
import {
  isValidEthereumAddress,
  isValidIPFSCID,
} from "@/utils/edgeCaseValidation";

const LOG_CONTEXT = "ContractService";

/**
 * Configuration for contract connection
 */
export interface ContractConfig {
  contractAddress: string;
  rpcEndpoints: string[];
  network: string;
}

/**
 * Message metadata stored on-chain
 */
export interface MessageMetadata {
  id: string;
  encryptedKeyCID: string;
  encryptedMessageCID: string;
  messageHash: string;
  unlockTimestamp: number;
  sender: string;
  recipient: string;
  createdAt: number;
}

/**
 * Result of a contract transaction
 */
export interface TransactionResult {
  success: boolean;
  messageId?: string;
  blockHash?: string;
  error?: string;
}

/**
 * Raw message structure returned by the smart contract
 */
interface ContractMessageResponse {
  encryptedKeyCid: string;
  encryptedMessageCid: string;
  messageHash: string;
  unlockTimestamp: bigint;
  sender: string;
  recipient: string;
  createdAt: bigint;
}

/**
 * ContractService provides methods for interacting with the Solidity smart contract
 * that stores time-locked message metadata on Passet Hub (Polkadot).
 */
export class ContractService {
  private static provider: ethers.JsonRpcProvider | null = null;
  private static contract: ethers.Contract | null = null;
  private static isConnecting = false;
  private static connectionPromise: Promise<ethers.JsonRpcProvider> | null =
    null;
  private static connectionListeners: Set<(connected: boolean) => void> =
    new Set();
  // Connection freshness tracking to avoid redundant RPC calls
  private static lastConnectionTest: number = 0;
  private static readonly CONNECTION_TTL = 30_000; // 30 seconds
  // Track current RPC endpoint index for fallback rotation
  private static currentEndpointIndex: number = 0;
  // Track failed endpoints to avoid immediate retry
  private static failedEndpoints: Map<string, number> = new Map();
  private static readonly ENDPOINT_COOLDOWN = 60_000; // 1 minute cooldown for failed endpoints

  /**
   * Get the contract configuration from environment variables and network config
   */
  private static getConfig(): ContractConfig {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const network = getCurrentNetwork();
    const rpcEndpoints = getRpcEndpoints();

    if (!contractAddress) {
      throw new Error(
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your environment variables."
      );
    }

    if (rpcEndpoints.length === 0) {
      throw new Error(
        "No RPC endpoints configured. Please check your network configuration."
      );
    }

    return {
      contractAddress,
      rpcEndpoints,
      network: network.name,
    };
  }

  /**
   * Get the next available RPC endpoint, skipping recently failed ones
   */
  private static getNextEndpoint(): string {
    const config = this.getConfig();
    const now = Date.now();

    // Clean up expired cooldowns
    this.failedEndpoints.forEach((failTime, endpoint) => {
      if (now - failTime > this.ENDPOINT_COOLDOWN) {
        this.failedEndpoints.delete(endpoint);
      }
    });

    // Find next available endpoint
    for (let i = 0; i < config.rpcEndpoints.length; i++) {
      const index = (this.currentEndpointIndex + i) % config.rpcEndpoints.length;
      const endpoint = config.rpcEndpoints[index];

      if (!this.failedEndpoints.has(endpoint)) {
        this.currentEndpointIndex = index;
        return endpoint;
      }
    }

    // All endpoints failed recently, use the oldest failed one
    this.currentEndpointIndex = 0;
    return config.rpcEndpoints[0];
  }

  /**
   * Mark an endpoint as failed
   */
  private static markEndpointFailed(endpoint: string): void {
    this.failedEndpoints.set(endpoint, Date.now());
    // Rotate to next endpoint
    const config = this.getConfig();
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % config.rpcEndpoints.length;
    ErrorLogger.warn(LOG_CONTEXT, "RPC endpoint marked as failed", {
      endpoint,
      nextIndex: this.currentEndpointIndex,
    });
  }

  /**
   * Connect to the Ethereum RPC endpoint
   *
   * @returns Promise resolving to JsonRpcProvider instance
   * @throws Error if connection fails
   */
  private static async connect(): Promise<ethers.JsonRpcProvider> {
    // Return existing connection if available and fresh
    if (this.provider) {
      // Skip connection test if we verified recently (within TTL)
      if (Date.now() - this.lastConnectionTest < this.CONNECTION_TTL) {
        return this.provider;
      }

      try {
        // Test connection only when TTL expired
        await this.provider.getBlockNumber();
        this.lastConnectionTest = Date.now();
        return this.provider;
      } catch {
        ErrorLogger.warn(LOG_CONTEXT, "Existing provider failed, reconnecting...");
        this.provider = null;
      }
    }

    // Return existing connection attempt if in progress
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.establishConnection();

    try {
      this.provider = await this.connectionPromise;
      return this.provider;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  /**
   * Establish a new connection to the RPC endpoint
   *
   * Uses multi-RPC fallback for improved reliability.
   * Automatically rotates to backup endpoints on failure.
   */
  private static async establishConnection(): Promise<ethers.JsonRpcProvider> {
    const config = this.getConfig();
    const endpoint = this.getNextEndpoint();

    return withRetry(
      async () => {
        // Create provider with custom network config to disable ENS
        // Passet Hub doesn't support ENS, so we must completely disable ENS resolution
        const network = new ethers.Network(config.network, getCurrentNetwork().chainId);

        // Remove all ENS-related plugins from the network
        const ensPluginName = "org.ethers.plugins.network.Ens";
        try {
          network.plugins.forEach((plugin) => {
            if (plugin.name === ensPluginName) {
              // @ts-expect-error - accessing private method to remove plugin
              network._plugins.delete(ensPluginName);
            }
          });
        } catch {
          // Ignore errors - plugin might not exist
        }

        ErrorLogger.debug(LOG_CONTEXT, "Creating provider with ENS disabled", {
          network: config.network,
          endpoint,
        });

        const provider = new ethers.JsonRpcProvider(
          endpoint,
          network,
          {
            staticNetwork: network, // Prevents network auto-detection
          }
        );

        // Test connection
        await withTimeout(
          provider.getBlockNumber(),
          TIMEOUTS.BLOCKCHAIN_CONNECT,
          `Ethereum RPC connection to ${endpoint}`
        );

        ErrorLogger.info(LOG_CONTEXT, "Connected to RPC endpoint", {
          network: config.network,
          endpoint,
          totalEndpoints: config.rpcEndpoints.length,
        });

        // Update connection freshness timestamp
        this.lastConnectionTest = Date.now();

        // Notify listeners of successful connection
        this.notifyConnectionListeners(true);

        return provider;
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        context: "RPCConnection",
        onRetry: (attempt, error, delay) => {
          ErrorLogger.warn(LOG_CONTEXT, `RPC connection retry ${attempt}/3`, {
            error: error.message,
            nextDelayMs: delay,
            endpoint,
          });
          // Mark current endpoint as failed and try next
          this.markEndpointFailed(endpoint);
        },
      }
    ).catch((error) => {
      this.markEndpointFailed(endpoint);
      this.notifyConnectionListeners(false);
      throw new Error(
        `Failed to connect to Ethereum RPC endpoint: ${error.message}. ` +
        `Tried ${config.rpcEndpoints.length} endpoint(s). ` +
        `Please check your network connection and ensure the RPC endpoint is accessible.`
      );
    });
  }

  /**
   * Get the current provider instance, connecting if necessary
   *
   * @returns Promise resolving to JsonRpcProvider instance
   */
  static async getProvider(): Promise<ethers.JsonRpcProvider> {
    return this.connect();
  }

  /**
   * Get the contract instance, initializing if necessary
   *
   * @returns Promise resolving to Contract instance
   */
  private static async getContract(): Promise<ethers.Contract> {
    if (this.contract) {
      return this.contract;
    }

    const provider = await this.getProvider();
    const config = this.getConfig();

    this.contract = new ethers.Contract(
      config.contractAddress,
      solidityAbi,
      provider
    );

    return this.contract;
  }

  /**
   * Disconnect from the RPC endpoint
   *
   * Call this when the application is closing or when you need to reset the connection.
   */
  static async disconnect(): Promise<void> {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
      this.contract = null;
      ErrorLogger.info(LOG_CONTEXT, "Disconnected from Ethereum RPC");
    }
  }

  /**
   * Check if the provider is currently connected
   *
   * @returns true if connected, false otherwise
   */
  static isConnected(): boolean {
    return this.provider !== null;
  }

  /**
   * Get the contract address from configuration
   *
   * @returns Contract address string
   */
  static getContractAddress(): string {
    return this.getConfig().contractAddress;
  }

  /**
   * Get the network name from configuration
   *
   * @returns Network name
   */
  static getNetwork(): string {
    return this.getConfig().network;
  }

  /**
   * Helper method to add delay for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Notify connection listeners of connection status changes
   */
  private static notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  /**
   * Add a connection status listener
   */
  static addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.add(listener);
  }

  /**
   * Remove a connection status listener
   */
  static removeConnectionListener(
    listener: (connected: boolean) => void
  ): void {
    this.connectionListeners.delete(listener);
  }

  /**
   * Get the total number of messages stored in the contract
   *
   * @returns Promise resolving to the message count
   */
  static async getMessageCount(): Promise<number> {
    const contract = await this.getContract();
    const count = await withTimeout(
      contract.getMessageCount.staticCall(),
      TIMEOUTS.BLOCKCHAIN_QUERY,
      "Get message count"
    );
    return Number(count);
  }

  /**
   * Get all messages sent by a specific address
   *
   * @param senderAddress - Ethereum address of the sender
   * @returns Promise resolving to array of message metadata
   */
  static async getSentMessages(
    senderAddress: string
  ): Promise<MessageMetadata[]> {
    const contract = await this.getContract();

    // Use staticCall to bypass ENS resolution
    // This calls the contract method directly without address resolution
    const messages = await withTimeout(
      contract.getSentMessages.staticCall(senderAddress),
      TIMEOUTS.BLOCKCHAIN_QUERY,
      "Get sent messages"
    );

    return (messages as ContractMessageResponse[]).map((msg, index) => ({
      id: index.toString(),
      encryptedKeyCID: msg.encryptedKeyCid,
      encryptedMessageCID: msg.encryptedMessageCid,
      messageHash: msg.messageHash,
      unlockTimestamp: this.toJsTimestamp(Number(msg.unlockTimestamp)),
      sender: msg.sender,
      recipient: msg.recipient,
      createdAt: this.toJsTimestamp(Number(msg.createdAt)),
    }));
  }

  /**
   * Convert blockchain timestamp (seconds) to JavaScript timestamp (milliseconds)
   * 
   * Solidity's block.timestamp is in seconds (Unix timestamp), but JavaScript's
   * Date constructor expects milliseconds. Without this conversion, dates appear
   * as January 1970 because the seconds value is interpreted as milliseconds.
   * 
   * @param blockchainTimestamp - Timestamp from blockchain (in seconds)
   * @returns Timestamp in milliseconds for JavaScript Date
   */
  private static toJsTimestamp(blockchainTimestamp: number): number {
    // If timestamp is already in milliseconds (> year 2001 in ms), return as-is
    // This handles edge cases where timestamps might already be converted
    if (blockchainTimestamp > 1_000_000_000_000) {
      return blockchainTimestamp;
    }
    return blockchainTimestamp * 1000;
  }

  /**
   * Get all messages received by a specific address
   *
   * @param recipientAddress - Ethereum address of the recipient
   * @returns Promise resolving to array of message metadata
   */
  static async getReceivedMessages(
    recipientAddress: string
  ): Promise<MessageMetadata[]> {
    const contract = await this.getContract();

    // Use staticCall to bypass ENS resolution
    // This calls the contract method directly without address resolution
    const messages = await withTimeout(
      contract.getReceivedMessages.staticCall(recipientAddress),
      TIMEOUTS.BLOCKCHAIN_QUERY,
      "Get received messages"
    );

    return (messages as ContractMessageResponse[]).map((msg, index) => ({
      id: index.toString(),
      encryptedKeyCID: msg.encryptedKeyCid,
      encryptedMessageCID: msg.encryptedMessageCid,
      messageHash: msg.messageHash,
      unlockTimestamp: this.toJsTimestamp(Number(msg.unlockTimestamp)),
      sender: msg.sender,
      recipient: msg.recipient,
      createdAt: this.toJsTimestamp(Number(msg.createdAt)),
    }));
  }

  /**
   * Get a specific message by its ID
   *
   * @param messageId - The message ID to retrieve
   * @returns Promise resolving to message metadata or null if not found
   */
  static async getMessage(messageId: string): Promise<MessageMetadata | null> {
    const contract = await this.getContract();
    try {
      const msg = await withTimeout(
        contract.getMessage.staticCall(messageId),
        TIMEOUTS.BLOCKCHAIN_QUERY,
        "Get message"
      );

      return {
        id: messageId,
        encryptedKeyCID: msg.encryptedKeyCid,
        encryptedMessageCID: msg.encryptedMessageCid,
        messageHash: msg.messageHash,
        unlockTimestamp: this.toJsTimestamp(Number(msg.unlockTimestamp)),
        sender: msg.sender,
        recipient: msg.recipient,
        createdAt: this.toJsTimestamp(Number(msg.createdAt)),
      };
    } catch (error) {
      // Message not found or other error
      ErrorLogger.warn(LOG_CONTEXT, `Failed to get message ${messageId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Validate all parameters before submitting a blockchain transaction.
   * This prevents wasted gas and invalid data being stored on-chain.
   *
   * @param params - Message parameters to validate
   * @param signerAddress - Signer address to validate
   * @throws Error with descriptive message if validation fails
   */
  private static validateStoreMessageParams(
    params: {
      encryptedKeyCID: string;
      encryptedMessageCID: string;
      messageHash: string;
      unlockTimestamp: number;
      recipient: string;
    },
    signerAddress: string
  ): void {
    // Validate encrypted key CID format
    if (!params.encryptedKeyCID || !isValidIPFSCID(params.encryptedKeyCID)) {
      throw new Error(
        "Invalid encrypted key CID format. Expected IPFS CID (Qm... or bafy...)"
      );
    }

    // Validate encrypted message CID format
    if (!params.encryptedMessageCID || !isValidIPFSCID(params.encryptedMessageCID)) {
      throw new Error(
        "Invalid encrypted message CID format. Expected IPFS CID (Qm... or bafy...)"
      );
    }

    // Validate message hash format (64 hex characters = 32 bytes SHA-256)
    if (!params.messageHash || !/^[a-fA-F0-9]{64}$/.test(params.messageHash)) {
      throw new Error(
        "Invalid message hash format. Expected 64 hexadecimal characters (SHA-256 hash)"
      );
    }

    // Validate unlock timestamp is in the future
    // Allow 60 seconds buffer for transaction processing time
    const minTimestamp = Date.now() + 60_000;
    if (!params.unlockTimestamp || params.unlockTimestamp <= minTimestamp) {
      throw new Error(
        "Unlock timestamp must be at least 1 minute in the future to allow for transaction processing"
      );
    }

    // Validate unlock timestamp is not too far in the future (10 years max)
    const maxTimestamp = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;
    if (params.unlockTimestamp > maxTimestamp) {
      throw new Error(
        "Unlock timestamp cannot be more than 10 years in the future"
      );
    }

    // Validate recipient address format
    if (!params.recipient || !isValidEthereumAddress(params.recipient)) {
      throw new Error(
        "Invalid recipient address format. Expected Ethereum address (0x followed by 40 hex characters)"
      );
    }

    // Validate signer address format
    if (!signerAddress || !isValidEthereumAddress(signerAddress)) {
      throw new Error(
        "Invalid signer address format. Expected Ethereum address (0x followed by 40 hex characters)"
      );
    }

    // Prevent sending to self
    if (signerAddress.toLowerCase() === params.recipient.toLowerCase()) {
      throw new Error("Cannot send a message to yourself");
    }
  }

  /**
   * Store a new message on the blockchain
   *
   * Validates all inputs before submitting the transaction to prevent
   * wasted gas and invalid data being stored on-chain.
   *
   * @param params - Message parameters
   * @param signerAddress - Ethereum address to sign the transaction
   * @returns Promise resolving to transaction result
   * @throws Error if validation fails (before transaction is submitted)
   */
  static async storeMessage(
    params: {
      encryptedKeyCID: string;
      encryptedMessageCID: string;
      messageHash: string;
      unlockTimestamp: number;
      recipient: string;
    },
    signerAddress: string
  ): Promise<TransactionResult> {
    try {
      // Validate all inputs BEFORE submitting transaction
      // This prevents wasted gas and invalid data on-chain
      this.validateStoreMessageParams(params, signerAddress);

      const config = this.getConfig();

      // Get signer from browser wallet (MetaMask or Talisman)
      if (typeof window === "undefined" || !(window as { ethereum?: unknown }).ethereum) {
        throw new Error(
          "No Ethereum wallet found. Please install Talisman (recommended) or MetaMask."
        );
      }

      const browserProvider = new ethers.BrowserProvider(
        (window as { ethereum: ethers.Eip1193Provider }).ethereum
      );
      const signer = await browserProvider.getSigner(signerAddress);

      const contract = new ethers.Contract(
        config.contractAddress,
        solidityAbi,
        signer
      );

      ErrorLogger.info(LOG_CONTEXT, "Submitting store message transaction", {
        recipient: params.recipient,
        unlockTimestamp: params.unlockTimestamp,
      });

      // Send transaction
      const tx = await withTimeout(
        contract.storeMessage(
          params.encryptedKeyCID,
          params.encryptedMessageCID,
          params.messageHash,
          params.unlockTimestamp,
          params.recipient
        ),
        TIMEOUTS.BLOCKCHAIN_TX_SUBMIT,
        "Store message transaction"
      );

      // Wait for transaction confirmation
      const receipt = await withTimeout(
        tx.wait(),
        TIMEOUTS.BLOCKCHAIN_TX_FINALIZE,
        "Transaction confirmation"
      );

      // Extract messageId from event
      const event = (receipt as ethers.TransactionReceipt).logs
        .map((log: ethers.Log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e) => e?.name === "MessageStored");

      ErrorLogger.info(LOG_CONTEXT, "Message stored successfully", {
        messageId: event?.args.messageId.toString(),
        blockHash: (receipt as ethers.TransactionReceipt).blockHash,
      });

      return {
        success: true,
        messageId: event?.args.messageId.toString(),
        blockHash: (receipt as ethers.TransactionReceipt).blockHash,
      };
    } catch (error) {
      ErrorLogger.error(
        error instanceof Error ? error : new Error(String(error)),
        LOG_CONTEXT,
        { operation: "storeMessage", recipient: params.recipient }
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transaction failed",
      };
    }
  }

  /**
   * Subscribe to MessageStored events
   *
   * @param callback - Function to call when a new message is stored
   * @returns Cleanup function to unsubscribe
   */
  static async subscribeToMessageEvents(
    callback: (event: {
      messageId: string;
      sender: string;
      recipient: string;
      unlockTimestamp: number;
    }) => void
  ): Promise<() => void> {
    const contract = await this.getContract();

    const listener = (
      messageId: bigint,
      sender: string,
      recipient: string,
      unlockTimestamp: bigint
    ) => {
      callback({
        messageId: messageId.toString(),
        sender,
        recipient,
        unlockTimestamp: Number(unlockTimestamp),
      });
    };

    contract.on("MessageStored", listener);

    // Return cleanup function
    return () => {
      contract.off("MessageStored", listener);
    };
  }
}

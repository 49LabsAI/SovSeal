// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 SovSeal Protocol Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

pragma solidity ^0.8.20;

/**
 * @title SovSeal (FutureProof)
 * @notice Smart contract for storing time-locked encrypted message metadata
 * @dev Stores IPFS CIDs and metadata for encrypted messages on Polkadot (SovSeal)
 * @custom:brand SovSeal - The Sovereign Protocol for Digital Legacy
 * 
 * This is the open-source core protocol contract. Anyone can deploy and build
 * applications on top of this standard.
 * 
 * Requirements implemented:
 * - 6.2: Store message metadata on blockchain
 * - 7.1: Query sent messages by sender
 * - 8.1: Query received messages by recipient
 */
contract SovSeal {
    /// @notice Message metadata stored on-chain
    struct MessageMetadata {
        string encryptedKeyCid;      // IPFS CID of the encrypted AES key
        string encryptedMessageCid;  // IPFS CID of the encrypted message blob
        string messageHash;          // SHA-256 hash of the encrypted message
        uint64 unlockTimestamp;      // Unix timestamp when message can be unlocked
        address sender;              // Address of the message sender
        address recipient;           // Address of the message recipient
        uint64 createdAt;            // Timestamp when message was created
    }

    /// @notice Counter for generating unique message IDs
    uint64 private messageCount;

    /// @notice Mapping from message ID to message metadata
    mapping(uint64 => MessageMetadata) private messages;

    /// @notice Mapping from sender address to list of message IDs
    mapping(address => uint64[]) private sentMessages;

    /// @notice Mapping from recipient address to list of message IDs
    mapping(address => uint64[]) private receivedMessages;

    /// @notice Emitted when a new message is stored
    event MessageStored(
        uint64 indexed messageId,
        address indexed sender,
        address indexed recipient,
        uint64 unlockTimestamp
    );

    /// @notice Custom errors for gas efficiency
    error InvalidTimestamp();
    error InvalidMessageHash();
    error InvalidKeyCID();
    error InvalidMessageCID();
    error SenderIsRecipient();
    error MessageNotFound();

    /**
     * @notice Store a new message on the blockchain
     * @param encryptedKeyCid IPFS CID of the encrypted AES key
     * @param encryptedMessageCid IPFS CID of the encrypted message blob
     * @param messageHash SHA-256 hash of the encrypted message (64 hex chars)
     * @param unlockTimestamp Unix timestamp when the message can be unlocked
     * @param recipient Address of the message recipient
     * @return messageId The unique ID of the stored message
     */
    function storeMessage(
        string calldata encryptedKeyCid,
        string calldata encryptedMessageCid,
        string calldata messageHash,
        uint64 unlockTimestamp,
        address recipient
    ) external returns (uint64 messageId) {
        // Validate input parameters
        if (bytes(encryptedKeyCid).length == 0) revert InvalidKeyCID();
        if (bytes(encryptedMessageCid).length == 0) revert InvalidMessageCID();
        if (bytes(messageHash).length < 64) revert InvalidMessageHash();
        if (unlockTimestamp <= block.timestamp) revert InvalidTimestamp();
        if (msg.sender == recipient) revert SenderIsRecipient();

        // Generate new message ID
        messageId = messageCount++;

        // Store message metadata
        messages[messageId] = MessageMetadata({
            encryptedKeyCid: encryptedKeyCid,
            encryptedMessageCid: encryptedMessageCid,
            messageHash: messageHash,
            unlockTimestamp: unlockTimestamp,
            sender: msg.sender,
            recipient: recipient,
            createdAt: uint64(block.timestamp)
        });

        // Update sender's sent messages list
        sentMessages[msg.sender].push(messageId);

        // Update recipient's received messages list
        receivedMessages[recipient].push(messageId);

        // Emit event
        emit MessageStored(messageId, msg.sender, recipient, unlockTimestamp);

        return messageId;
    }

    /**
     * @notice Get all messages sent by a specific address
     * @param sender Address of the sender
     * @return Array of message metadata
     */
    function getSentMessages(address sender) 
        external 
        view 
        returns (MessageMetadata[] memory) 
    {
        uint64[] memory messageIds = sentMessages[sender];
        return _getMessagesByIds(messageIds);
    }

    /**
     * @notice Get all messages received by a specific address
     * @param recipient Address of the recipient
     * @return Array of message metadata
     */
    function getReceivedMessages(address recipient) 
        external 
        view 
        returns (MessageMetadata[] memory) 
    {
        uint64[] memory messageIds = receivedMessages[recipient];
        return _getMessagesByIds(messageIds);
    }

    /**
     * @notice Get a specific message by ID
     * @param messageId The message ID
     * @return Message metadata
     */
    function getMessage(uint64 messageId) 
        external 
        view 
        returns (MessageMetadata memory) 
    {
        MessageMetadata memory message = messages[messageId];
        if (message.sender == address(0)) revert MessageNotFound();
        return message;
    }

    /**
     * @notice Get the total number of messages stored
     * @return Total message count
     */
    function getMessageCount() external view returns (uint64) {
        return messageCount;
    }

    /**
     * @notice Helper function to retrieve messages by their IDs
     * @param messageIds Array of message IDs
     * @return Array of message metadata
     */
    function _getMessagesByIds(uint64[] memory messageIds) 
        private 
        view 
        returns (MessageMetadata[] memory) 
    {
        MessageMetadata[] memory result = new MessageMetadata[](messageIds.length);
        
        for (uint256 i = 0; i < messageIds.length; i++) {
            result[i] = messages[messageIds[i]];
        }
        
        return result;
    }
}

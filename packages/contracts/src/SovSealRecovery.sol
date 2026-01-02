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
 * @title SovSealRecovery
 * @notice On-chain guardian registry with time-delayed recovery for SovSeal
 * @dev Implements social recovery with weighted guardians and time-lock protection
 * 
 * This is the open-source social recovery contract for the SovSeal Protocol.
 * Anyone can deploy and integrate this with their own applications.
 * 
 * Security Model:
 * 1. Owner sets up guardians with individual weights
 * 2. Recovery requires threshold weight of guardian approvals
 * 3. 7-day time-lock before execution (owner can cancel)
 * 4. Owner can update guardians anytime
 */
contract SovSealRecovery {
    // ============ Structs ============

    struct Guardian {
        address addr;
        uint256 weight;
        bool isActive;
    }

    struct RecoveryRequest {
        address owner;           // Original account owner
        address newOwner;        // Proposed new owner
        uint256 threshold;       // Required approval weight
        uint256 approvalWeight;  // Current approval weight
        uint256 initiatedAt;     // When recovery was initiated
        uint256 executeAfter;    // When execution becomes possible
        bool executed;
        bool cancelled;
        mapping(address => bool) hasApproved; // Guardian approval tracking
    }

    // ============ Constants ============

    uint256 public constant RECOVERY_DELAY = 7 days;
    uint256 public constant MIN_THRESHOLD = 2;
    uint256 public constant MAX_GUARDIANS = 10;

    // ============ State ============

    /// @notice Mapping from owner address to their guardians
    mapping(address => Guardian[]) public guardians;

    /// @notice Mapping from owner address to their recovery threshold
    mapping(address => uint256) public thresholds;

    /// @notice Recovery requests by ID
    mapping(uint256 => RecoveryRequest) private recoveryRequests;

    /// @notice Total recovery request count
    uint256 public recoveryCount;

    /// @notice Mapping from owner to active recovery request ID (0 if none)
    mapping(address => uint256) public activeRecovery;

    // ============ Events ============

    event GuardianAdded(
        address indexed owner,
        address indexed guardian,
        uint256 weight
    );

    event GuardianRemoved(
        address indexed owner,
        address indexed guardian
    );

    event ThresholdUpdated(
        address indexed owner,
        uint256 newThreshold
    );

    event RecoveryInitiated(
        uint256 indexed requestId,
        address indexed owner,
        address indexed newOwner,
        uint256 executeAfter
    );

    event RecoveryApproved(
        uint256 indexed requestId,
        address indexed guardian,
        uint256 currentWeight,
        uint256 threshold
    );

    event RecoveryExecuted(
        uint256 indexed requestId,
        address indexed oldOwner,
        address indexed newOwner
    );

    event RecoveryCancelled(
        uint256 indexed requestId,
        address cancelledBy
    );

    // ============ Errors ============

    error NotOwner();
    error NotGuardian();
    error InvalidAddress();
    error InvalidThreshold();
    error GuardianAlreadyExists();
    error GuardianNotFound();
    error MaxGuardiansReached();
    error NoActiveRecovery();
    error RecoveryAlreadyActive();
    error RecoveryNotReady();
    error RecoveryAlreadyApproved();
    error RecoveryAlreadyExecuted();
    error RecoveryAlreadyCancelled();
    error TimeLockNotExpired();
    error ThresholdNotMet();

    // ============ Modifiers ============

    modifier onlyOwner(address owner) {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }

    // ============ Guardian Management ============

    /**
     * @notice Add a new guardian
     * @param guardian Address of the guardian
     * @param weight Voting weight of the guardian
     */
    function addGuardian(
        address guardian,
        uint256 weight
    ) external validAddress(guardian) {
        if (guardian == msg.sender) revert InvalidAddress();
        if (guardians[msg.sender].length >= MAX_GUARDIANS) revert MaxGuardiansReached();
        if (weight == 0) revert InvalidThreshold();

        // Check for duplicate
        Guardian[] storage ownerGuardians = guardians[msg.sender];
        for (uint256 i = 0; i < ownerGuardians.length; i++) {
            if (ownerGuardians[i].addr == guardian && ownerGuardians[i].isActive) {
                revert GuardianAlreadyExists();
            }
        }

        ownerGuardians.push(Guardian({
            addr: guardian,
            weight: weight,
            isActive: true
        }));

        emit GuardianAdded(msg.sender, guardian, weight);
    }

    /**
     * @notice Remove a guardian
     * @param guardian Address of the guardian to remove
     */
    function removeGuardian(address guardian) external {
        Guardian[] storage ownerGuardians = guardians[msg.sender];
        bool found = false;

        for (uint256 i = 0; i < ownerGuardians.length; i++) {
            if (ownerGuardians[i].addr == guardian && ownerGuardians[i].isActive) {
                ownerGuardians[i].isActive = false;
                found = true;
                break;
            }
        }

        if (!found) revert GuardianNotFound();

        emit GuardianRemoved(msg.sender, guardian);
    }

    /**
     * @notice Set the recovery threshold
     * @param newThreshold Required weight for recovery approval
     */
    function setThreshold(uint256 newThreshold) external {
        if (newThreshold < MIN_THRESHOLD) revert InvalidThreshold();
        
        uint256 totalWeight = _getTotalGuardianWeight(msg.sender);
        if (newThreshold > totalWeight) revert InvalidThreshold();

        thresholds[msg.sender] = newThreshold;

        emit ThresholdUpdated(msg.sender, newThreshold);
    }

    /**
     * @notice Get all active guardians for an owner
     * @param owner The owner address
     * @return Array of active guardians
     */
    function getGuardians(address owner) external view returns (Guardian[] memory) {
        Guardian[] storage ownerGuardians = guardians[owner];
        uint256 activeCount = 0;

        // Count active guardians
        for (uint256 i = 0; i < ownerGuardians.length; i++) {
            if (ownerGuardians[i].isActive) {
                activeCount++;
            }
        }

        // Create result array
        Guardian[] memory result = new Guardian[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < ownerGuardians.length; i++) {
            if (ownerGuardians[i].isActive) {
                result[index] = ownerGuardians[i];
                index++;
            }
        }

        return result;
    }

    // ============ Recovery Flow ============

    /**
     * @notice Initiate a recovery request (called by guardian)
     * @param owner Address of the account to recover
     * @param newOwner Address of the proposed new owner
     * @return requestId The ID of the created recovery request
     */
    function initiateRecovery(
        address owner,
        address newOwner
    ) external validAddress(owner) validAddress(newOwner) returns (uint256 requestId) {
        if (owner == newOwner) revert InvalidAddress();
        if (activeRecovery[owner] != 0) revert RecoveryAlreadyActive();

        // Verify caller is a guardian
        if (!_isGuardian(owner, msg.sender)) revert NotGuardian();

        // Verify threshold is set
        uint256 threshold = thresholds[owner];
        if (threshold < MIN_THRESHOLD) revert InvalidThreshold();

        // Create recovery request
        requestId = ++recoveryCount;
        RecoveryRequest storage request = recoveryRequests[requestId];
        request.owner = owner;
        request.newOwner = newOwner;
        request.threshold = threshold;
        request.approvalWeight = 0;
        request.initiatedAt = block.timestamp;
        request.executeAfter = block.timestamp + RECOVERY_DELAY;
        request.executed = false;
        request.cancelled = false;

        // Set active recovery
        activeRecovery[owner] = requestId;

        emit RecoveryInitiated(requestId, owner, newOwner, request.executeAfter);

        return requestId;
    }

    /**
     * @notice Approve a recovery request (called by guardian)
     * @param requestId The recovery request ID
     */
    function approveRecovery(uint256 requestId) external {
        RecoveryRequest storage request = recoveryRequests[requestId];
        
        if (request.owner == address(0)) revert NoActiveRecovery();
        if (request.executed) revert RecoveryAlreadyExecuted();
        if (request.cancelled) revert RecoveryAlreadyCancelled();
        if (request.hasApproved[msg.sender]) revert RecoveryAlreadyApproved();

        // Verify caller is a guardian
        if (!_isGuardian(request.owner, msg.sender)) revert NotGuardian();

        // Get guardian weight
        uint256 weight = _getGuardianWeight(request.owner, msg.sender);

        // Record approval
        request.hasApproved[msg.sender] = true;
        request.approvalWeight += weight;

        emit RecoveryApproved(
            requestId,
            msg.sender,
            request.approvalWeight,
            request.threshold
        );
    }

    /**
     * @notice Execute a recovery request after time-lock
     * @param requestId The recovery request ID
     */
    function executeRecovery(uint256 requestId) external {
        RecoveryRequest storage request = recoveryRequests[requestId];

        if (request.owner == address(0)) revert NoActiveRecovery();
        if (request.executed) revert RecoveryAlreadyExecuted();
        if (request.cancelled) revert RecoveryAlreadyCancelled();
        if (block.timestamp < request.executeAfter) revert TimeLockNotExpired();
        if (request.approvalWeight < request.threshold) revert ThresholdNotMet();

        // Execute recovery
        request.executed = true;
        activeRecovery[request.owner] = 0;

        // Transfer guardian ownership (copy guardians to new owner)
        Guardian[] storage oldGuardians = guardians[request.owner];
        for (uint256 i = 0; i < oldGuardians.length; i++) {
            if (oldGuardians[i].isActive) {
                guardians[request.newOwner].push(oldGuardians[i]);
            }
        }
        thresholds[request.newOwner] = thresholds[request.owner];

        emit RecoveryExecuted(requestId, request.owner, request.newOwner);
    }

    /**
     * @notice Cancel an active recovery request
     * @param requestId The recovery request ID
     */
    function cancelRecovery(uint256 requestId) external {
        RecoveryRequest storage request = recoveryRequests[requestId];

        if (request.owner == address(0)) revert NoActiveRecovery();
        if (request.executed) revert RecoveryAlreadyExecuted();
        if (request.cancelled) revert RecoveryAlreadyCancelled();

        // Only owner or guardian can cancel
        bool isOwner = msg.sender == request.owner;
        bool isGuardian = _isGuardian(request.owner, msg.sender);
        if (!isOwner && !isGuardian) revert NotGuardian();

        request.cancelled = true;
        activeRecovery[request.owner] = 0;

        emit RecoveryCancelled(requestId, msg.sender);
    }

    /**
     * @notice Get recovery request details
     * @param requestId The recovery request ID
     */
    function getRecoveryRequest(uint256 requestId) external view returns (
        address owner,
        address newOwner,
        uint256 threshold,
        uint256 approvalWeight,
        uint256 initiatedAt,
        uint256 executeAfter,
        bool executed,
        bool cancelled
    ) {
        RecoveryRequest storage request = recoveryRequests[requestId];
        return (
            request.owner,
            request.newOwner,
            request.threshold,
            request.approvalWeight,
            request.initiatedAt,
            request.executeAfter,
            request.executed,
            request.cancelled
        );
    }

    // ============ Internal Functions ============

    function _isGuardian(address owner, address guardian) internal view returns (bool) {
        Guardian[] storage ownerGuardians = guardians[owner];
        for (uint256 i = 0; i < ownerGuardians.length; i++) {
            if (ownerGuardians[i].addr == guardian && ownerGuardians[i].isActive) {
                return true;
            }
        }
        return false;
    }

    function _getGuardianWeight(address owner, address guardian) internal view returns (uint256) {
        Guardian[] storage ownerGuardians = guardians[owner];
        for (uint256 i = 0; i < ownerGuardians.length; i++) {
            if (ownerGuardians[i].addr == guardian && ownerGuardians[i].isActive) {
                return ownerGuardians[i].weight;
            }
        }
        return 0;
    }

    function _getTotalGuardianWeight(address owner) internal view returns (uint256) {
        Guardian[] storage ownerGuardians = guardians[owner];
        uint256 total = 0;
        for (uint256 i = 0; i < ownerGuardians.length; i++) {
            if (ownerGuardians[i].isActive) {
                total += ownerGuardians[i].weight;
            }
        }
        return total;
    }
}

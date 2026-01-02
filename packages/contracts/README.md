# @sovseal/contracts

The official smart contracts for the **SovSeal Protocol** — the sovereign protocol for digital legacy and time-locked media.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636.svg)](https://soliditylang.org/)

## Overview

This package contains the core smart contracts that power the SovSeal Protocol:

| Contract | Description |
|----------|-------------|
| **SovSeal.sol** | Core time-locked message storage with IPFS integration |
| **SovSealRecovery.sol** | Social recovery with weighted guardians and time-lock |

## Installation

```bash
npm install @sovseal/contracts
# or
yarn add @sovseal/contracts
```

## Usage

### Import in Solidity

```solidity
import "@sovseal/contracts/src/SovSeal.sol";
import "@sovseal/contracts/src/SovSealRecovery.sol";
```

### Deploy

```javascript
const { ethers } = require("hardhat");

async function main() {
  const SovSeal = await ethers.getContractFactory("SovSeal");
  const sovseal = await SovSeal.deploy();
  console.log("SovSeal deployed to:", sovseal.address);
}
```

## Contract Interfaces

### SovSeal.sol

The core contract for storing time-locked encrypted message metadata.

```solidity
// Store a new message
function storeMessage(
    string calldata encryptedKeyCid,
    string calldata encryptedMessageCid,
    string calldata messageHash,
    uint64 unlockTimestamp,
    address recipient
) external returns (uint64 messageId);

// Get messages sent by an address
function getSentMessages(address sender) external view returns (MessageMetadata[] memory);

// Get messages received by an address
function getReceivedMessages(address recipient) external view returns (MessageMetadata[] memory);

// Get a specific message by ID
function getMessage(uint64 messageId) external view returns (MessageMetadata memory);
```

### SovSealRecovery.sol

Social recovery contract with guardian management and time-delayed recovery.

```solidity
// Add a guardian
function addGuardian(address guardian, uint256 weight) external;

// Remove a guardian
function removeGuardian(address guardian) external;

// Set recovery threshold
function setThreshold(uint256 newThreshold) external;

// Initiate recovery (called by guardian)
function initiateRecovery(address owner, address newOwner) external returns (uint256 requestId);

// Approve recovery (called by guardian)
function approveRecovery(uint256 requestId) external;

// Execute recovery after 7-day time-lock
function executeRecovery(uint256 requestId) external;

// Cancel recovery (called by owner or guardian)
function cancelRecovery(uint256 requestId) external;
```

## Security

### Recovery Time-Lock

All recovery requests have a **7-day time-lock** before execution. This gives the original owner time to cancel fraudulent recovery attempts.

### Constants

- `RECOVERY_DELAY`: 7 days
- `MIN_THRESHOLD`: 2 (minimum guardian weight required)
- `MAX_GUARDIANS`: 10 per account

## Deployment Addresses

| Network | SovSeal | SovSealRecovery |
|---------|---------|-----------------|
| Polkadot Asset Hub Mainnet | `TBD` | `TBD` |
| Passet Hub Testnet | `0x...` | `0x...` |

## License

Apache-2.0 — See [LICENSE](./LICENSE) for details.

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/sovseal/contracts/CONTRIBUTING.md).

## Security Audits

- [ ] Formal verification (in progress)
- [ ] Third-party audit (planned)

## Links

- [Website](https://sovseal.io)
- [Documentation](https://docs.sovseal.io)
- [Discord](https://discord.gg/sovseal)
- [Twitter](https://twitter.com/sovseal)

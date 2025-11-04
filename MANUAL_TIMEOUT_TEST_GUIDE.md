# Manual Timeout Testing Guide

**Purpose**: Complete Phase 1 timeout verification with real-world testing  
**Prerequisites**: Talisman wallet extension, Westend testnet tokens  
**Estimated Time**: 45-60 minutes  
**Date**: November 2, 2025

---

## Prerequisites Setup

### 1. Install Talisman Wallet Extension

1. Visit https://talisman.xyz
2. Download extension for your browser (Chrome/Firefox/Brave)
3. Install and create a new wallet (or import existing)
4. **IMPORTANT**: Back up your seed phrase securely

### 2. Get Westend Testnet Tokens

1. Copy your wallet address from Talisman
2. Visit https://faucet.polkadot.io/westend
3. Paste your address and request tokens
4. Wait for confirmation (~30 seconds)
5. Verify balance in Talisman (should show WND tokens)

### 3. Set Up Storacha (Web3.Storage)

1. Visit https://web3.storage
2. Sign up or log in with your email
3. **Note**: The new w3up-client uses email-based authentication
4. No API token needed - authentication happens automatically in the app
5. For testing, the app will use the Storacha client directly

**Important**: Unlike the old Web3.Storage, Storacha (w3up-client) doesn't require API tokens in environment variables. Authentication is handled via email or delegation tokens at runtime.

### 4. Configure Environment

Ensure `.env.local` has:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_RPC_ENDPOINT=wss://westend-rpc.polkadot.io
NEXT_PUBLIC_NETWORK=westend
# Note: Storacha (w3up-client) uses email-based authentication
# No API token required - authentication happens via email or delegation
```

### 5. Start Dev Server

```bash
npm run dev
```

Open http://localhost:3000 in browser with Talisman installed.

---

## Test Procedure

### Test Session Setup

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Enable "Preserve log"
4. Go to Console tab
5. Keep both tabs visible during testing

### Network Throttling Setup

In Chrome DevTools Network tab:

1. Click "No throttling" dropdown
2. Select throttling profile as specified in each test
3. Verify throttling is active (shows in dropdown)

---

## Test Suite 1: Wallet Operations

### Test 1.1: Wallet Connection (Normal Network)

**Setup**:

- Network: No throttling
- Wallet: Unlocked and ready

**Steps**:

1. Click "Connect Talisman Wallet" button
2. Approve connection in Talisman popup
3. Observe connection time

**Expected**:

- ✅ Connection completes in 1-3 seconds
- ✅ Account selector appears
- ✅ No timeout errors

**Record**:

- [ ] Connection time: **\_** seconds
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 1.2: Wallet Connection (Slow 3G)

**Setup**:

- Network: Slow 3G (400ms RTT, 400kbps)
- Wallet: Unlocked

**Steps**:

1. Apply Slow 3G throttling
2. Refresh page
3. Click "Connect Talisman Wallet"
4. Approve connection

**Expected**:

- ✅ Connection completes in 5-15 seconds
- ✅ No timeout (30s limit)
- ✅ Account selector appears

**Record**:

- [ ] Connection time: **\_** seconds
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Timeout triggered: ✅ Yes / ❌ No
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 1.3: Wallet Connection Timeout

**Setup**:

- Network: No throttling
- Wallet: **LOCKED** (lock Talisman before test)

**Steps**:

1. Lock Talisman wallet
2. Click "Connect Talisman Wallet"
3. **DO NOT unlock wallet**
4. Wait 35 seconds

**Expected**:

- ✅ Timeout error after 30 seconds
- ✅ Error message: "Wallet connection timed out. Please ensure Talisman extension is unlocked and responsive."
- ✅ Button re-enabled for retry

**Record**:

- [ ] Timeout occurred: ✅ Yes / ❌ No
- [ ] Timeout duration: **\_** seconds
- [ ] Error message shown: ✅ Yes / ❌ No
- [ ] Error message text: ****\*\*****\_****\*\*****
- [ ] Retry button enabled: ✅ Yes / ❌ No
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 1.4: Message Signing Timeout

**Setup**:

- Network: No throttling
- Wallet: Connected and unlocked

**Steps**:

1. Connect wallet
2. Navigate to Create Message page
3. Fill in recipient address
4. Click "Sign Message" (if available)
5. **DO NOT approve** in Talisman popup
6. Wait 125 seconds

**Expected**:

- ✅ Timeout after 120 seconds
- ✅ Error message: "Message signing timed out. Please check your wallet extension and try again."
- ✅ Can retry operation

**Record**:

- [ ] Timeout occurred: ✅ Yes / ❌ No
- [ ] Timeout duration: **\_** seconds
- [ ] Error message shown: ✅ Yes / ❌ No
- [ ] Notes: ****\*\*****\_****\*\*****

---

## Test Suite 2: Blockchain Operations

### Test 2.1: RPC Connection (Normal Network)

**Setup**:

- Network: No throttling
- Wallet: Connected

**Steps**:

1. Connect wallet (triggers RPC connection)
2. Observe console for connection messages
3. Check for errors

**Expected**:

- ✅ Connection completes in 1-3 seconds
- ✅ Console: "Connected to westend at wss://westend-rpc.polkadot.io"
- ✅ No timeout errors

**Record**:

- [ ] Connection time: **\_** seconds
- [ ] Console message: ****\*\*****\_****\*\*****
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 2.2: RPC Connection (Slow 3G)

**Setup**:

- Network: Slow 3G
- Wallet: Connected

**Steps**:

1. Apply Slow 3G throttling
2. Refresh page
3. Connect wallet
4. Observe connection time

**Expected**:

- ✅ Connection completes in 5-15 seconds
- ✅ No timeout (15s limit)
- ✅ Dashboard loads successfully

**Record**:

- [ ] Connection time: **\_** seconds
- [ ] Timeout triggered: ✅ Yes / ❌ No
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 2.3: RPC Connection Timeout

**Setup**:

- Network: No throttling
- RPC: Invalid endpoint

**Steps**:

1. Edit `.env.local`: `NEXT_PUBLIC_RPC_ENDPOINT=wss://invalid-endpoint.example.com`
2. Restart dev server
3. Try to connect wallet
4. Wait 20 seconds

**Expected**:

- ✅ Timeout after 15 seconds
- ✅ Error message includes "Failed to connect to Polkadot RPC endpoint"
- ✅ Error includes troubleshooting guidance

**Record**:

- [ ] Timeout occurred: ✅ Yes / ❌ No
- [ ] Timeout duration: **\_** seconds
- [ ] Error message: ****\*\*****\_****\*\*****
- [ ] Troubleshooting shown: ✅ Yes / ❌ No
- [ ] Notes: ****\*\*****\_****\*\*****

**Cleanup**: Restore correct RPC endpoint and restart server

---

### Test 2.4: Transaction Submission (Normal Network)

**Setup**:

- Network: No throttling
- Wallet: Connected with WND tokens

**Steps**:

1. Navigate to Create Message page
2. Fill in all fields (recipient, unlock time, message)
3. Upload or record media
4. Click "Create Message"
5. Approve transaction in Talisman
6. Observe transaction progress

**Expected**:

- ✅ Transaction submits in 5-10 seconds
- ✅ Finalization completes in 30-60 seconds
- ✅ No timeout (120s limit)
- ✅ Success message shown

**Record**:

- [ ] Submission time: **\_** seconds
- [ ] Finalization time: **\_** seconds
- [ ] Total time: **\_** seconds
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Block hash: ****\*\*****\_****\*\*****
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 2.5: Transaction Submission (Slow 3G)

**Setup**:

- Network: Slow 3G
- Wallet: Connected with WND tokens

**Steps**:

1. Apply Slow 3G throttling
2. Create message (same as Test 2.4)
3. Approve transaction
4. Observe timing

**Expected**:

- ✅ Transaction completes in 60-120 seconds
- ✅ No timeout (120s limit)
- ✅ Progress indicator shows status

**Record**:

- [ ] Total time: **\_** seconds
- [ ] Timeout triggered: ✅ Yes / ❌ No
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 2.6: Query Messages (Normal Network)

**Setup**:

- Network: No throttling
- Wallet: Connected
- Prerequisite: At least 1 message created

**Steps**:

1. Navigate to Dashboard
2. Observe message loading
3. Check console for query logs

**Expected**:

- ✅ Messages load in 5-15 seconds
- ✅ No timeout (60s batch limit)
- ✅ Messages display correctly

**Record**:

- [ ] Load time: **\_** seconds
- [ ] Messages found: **\_** count
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 2.7: Query Messages (Slow 3G)

**Setup**:

- Network: Slow 3G
- Wallet: Connected

**Steps**:

1. Apply Slow 3G throttling
2. Navigate to Dashboard
3. Observe loading time

**Expected**:

- ✅ Messages load in 30-60 seconds
- ✅ No timeout (60s batch limit)
- ✅ Loading indicator shown

**Record**:

- [ ] Load time: **\_** seconds
- [ ] Timeout triggered: ✅ Yes / ❌ No
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

## Test Suite 3: IPFS Operations

### Test 3.1: Upload Small File (< 10MB, Normal Network)

**Setup**:

- Network: No throttling
- Wallet: Connected
- File: Prepare 5MB test file

**Steps**:

1. Navigate to Create Message page
2. Upload 5MB media file
3. Observe upload progress
4. Check console for timing

**Expected**:

- ✅ Upload completes in 5-15 seconds
- ✅ No timeout (30s limit for small files)
- ✅ Progress bar updates smoothly
- ✅ CID verification succeeds

**Record**:

- [ ] File size: **\_** MB
- [ ] Upload time: **\_** seconds
- [ ] Verification time: **\_** seconds
- [ ] Total time: **\_** seconds
- [ ] CID: ****\*\*****\_****\*\*****
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 3.2: Upload Small File (Slow 3G)

**Setup**:

- Network: Slow 3G
- File: 5MB test file

**Steps**:

1. Apply Slow 3G throttling
2. Upload file
3. Observe timing

**Expected**:

- ✅ Upload completes in 20-30 seconds
- ✅ No timeout (30s limit)
- ✅ Progress bar shows incremental progress

**Record**:

- [ ] Upload time: **\_** seconds
- [ ] Timeout triggered: ✅ Yes / ❌ No
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 3.3: Upload Large File (> 10MB, Normal Network)

**Setup**:

- Network: No throttling
- File: Prepare 25MB test file

**Steps**:

1. Upload 25MB media file
2. Observe upload progress
3. Check timeout value used

**Expected**:

- ✅ Upload completes in 15-30 seconds
- ✅ No timeout (60s limit for large files)
- ✅ Console shows "IPFS upload (25.00 MB)"
- ✅ Verification succeeds

**Record**:

- [ ] File size: **\_** MB
- [ ] Upload time: **\_** seconds
- [ ] Timeout value used: **\_** seconds
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 3.4: Upload Large File (Slow 3G)

**Setup**:

- Network: Slow 3G
- File: 25MB test file

**Steps**:

1. Apply Slow 3G throttling
2. Upload file
3. Observe timing

**Expected**:

- ✅ Upload completes in 40-60 seconds
- ✅ No timeout (60s limit)
- ✅ Progress updates throughout

**Record**:

- [ ] Upload time: **\_** seconds
- [ ] Timeout triggered: ✅ Yes / ❌ No
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 3.5: Upload Timeout Simulation

**Setup**:

- Network: Offline mode
- File: Any size

**Steps**:

1. Start upload
2. Immediately switch to Offline mode in DevTools
3. Wait 65 seconds

**Expected**:

- ✅ Timeout after 30s (small) or 60s (large)
- ✅ Error message: "Operation 'IPFS upload (X.XX MB)' timed out after XXXXXms"
- ✅ Retry option available

**Record**:

- [ ] Timeout occurred: ✅ Yes / ❌ No
- [ ] Timeout duration: **\_** seconds
- [ ] Error message: ****\*\*****\_****\*\*****
- [ ] Retry available: ✅ Yes / ❌ No
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 3.6: Download Encrypted Blob (Normal Network)

**Setup**:

- Network: No throttling
- Prerequisite: Message with media created

**Steps**:

1. Navigate to Dashboard
2. Click on a message to view
3. Observe media download
4. Check console for timing

**Expected**:

- ✅ Download completes in 5-15 seconds
- ✅ No timeout (45s limit)
- ✅ Media plays correctly

**Record**:

- [ ] Download time: **\_** seconds
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 3.7: Download Timeout Simulation

**Setup**:

- Network: Offline mode
- Prerequisite: Message with media

**Steps**:

1. Start viewing message
2. Switch to Offline mode
3. Wait 50 seconds

**Expected**:

- ✅ Timeout after 45 seconds
- ✅ Error message: "IPFS download failed"
- ✅ Retry option available

**Record**:

- [ ] Timeout occurred: ✅ Yes / ❌ No
- [ ] Timeout duration: **\_** seconds
- [ ] Error message: ****\*\*****\_****\*\*****
- [ ] Notes: ****\*\*****\_****\*\*****

---

## Test Suite 4: Crypto Operations

### Test 4.1: Public Key Retrieval (Normal Network)

**Setup**:

- Network: No throttling
- Wallet: Connected

**Steps**:

1. Navigate to Create Message page
2. Enter recipient address
3. Observe public key fetch (check console)

**Expected**:

- ✅ Public key retrieved in 1-2 seconds
- ✅ No timeout (10s limit)
- ✅ No errors in console

**Record**:

- [ ] Retrieval time: **\_** seconds
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 4.2: Public Key Retrieval (Slow 3G)

**Setup**:

- Network: Slow 3G
- Wallet: Connected

**Steps**:

1. Apply Slow 3G throttling
2. Attempt public key retrieval
3. Observe timing

**Expected**:

- ✅ Retrieval completes in 3-8 seconds
- ✅ No timeout (10s limit)

**Record**:

- [ ] Retrieval time: **\_** seconds
- [ ] Timeout triggered: ✅ Yes / ❌ No
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

## Test Suite 5: End-to-End Scenarios

### Test 5.1: Complete Message Creation (Normal Network)

**Setup**:

- Network: No throttling
- Wallet: Connected with tokens
- File: 10MB test file

**Steps**:

1. Navigate to Create Message
2. Fill all fields
3. Upload media
4. Submit transaction
5. Verify on Dashboard

**Expected**:

- ✅ Total time: 30-90 seconds
- ✅ No timeouts at any stage
- ✅ Message appears on Dashboard

**Record**:

- [ ] Media upload: **\_** seconds
- [ ] Transaction: **\_** seconds
- [ ] Total time: **\_** seconds
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 5.2: Complete Message Creation (Slow 3G)

**Setup**:

- Network: Slow 3G
- Wallet: Connected with tokens
- File: 10MB test file

**Steps**:

1. Apply Slow 3G throttling
2. Complete message creation flow
3. Observe all stages

**Expected**:

- ✅ Total time: 90-180 seconds
- ✅ No timeouts (all operations within limits)
- ✅ Progress indicators work correctly

**Record**:

- [ ] Media upload: **\_** seconds
- [ ] Transaction: **\_** seconds
- [ ] Total time: **\_** seconds
- [ ] Timeout triggered: ✅ Yes / ❌ No
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 5.3: Dashboard Loading (Normal Network)

**Setup**:

- Network: No throttling
- Wallet: Connected
- Prerequisite: 5+ messages created

**Steps**:

1. Navigate to Dashboard
2. Observe loading time
3. Check all messages display

**Expected**:

- ✅ Load time: 5-20 seconds
- ✅ No timeouts
- ✅ All messages display correctly

**Record**:

- [ ] Load time: **\_** seconds
- [ ] Messages loaded: **\_** count
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

### Test 5.4: Dashboard Loading (Slow 3G)

**Setup**:

- Network: Slow 3G
- Wallet: Connected

**Steps**:

1. Apply Slow 3G throttling
2. Navigate to Dashboard
3. Observe loading

**Expected**:

- ✅ Load time: 30-60 seconds
- ✅ No timeouts
- ✅ Loading indicators shown

**Record**:

- [ ] Load time: **\_** seconds
- [ ] Timeout triggered: ✅ Yes / ❌ No
- [ ] Status: ✅ Success / ❌ Failed
- [ ] Notes: ****\*\*****\_****\*\*****

---

## Test Results Summary

### Overall Statistics

- Total tests executed: **\_** / 24
- Tests passed: **\_**
- Tests failed: **\_**
- Timeouts triggered (expected): **\_**
- Timeouts triggered (unexpected): **\_**

### Timeout Values Verification

| Operation           | Expected Timeout | Observed Timeout | Status  |
| ------------------- | ---------------- | ---------------- | ------- |
| IPFS Upload (small) | 30s              | **\_** s         | ✅ / ❌ |
| IPFS Upload (large) | 60s              | **\_** s         | ✅ / ❌ |
| IPFS Verification   | 30s              | **\_** s         | ✅ / ❌ |
| IPFS Download       | 45s              | **\_** s         | ✅ / ❌ |
| RPC Connection      | 15s              | **\_** s         | ✅ / ❌ |
| Block Query         | 10s              | **\_** s         | ✅ / ❌ |
| Batch Query         | 60s              | **\_** s         | ✅ / ❌ |
| Transaction         | 120s             | **\_** s         | ✅ / ❌ |
| Wallet Enable       | 30s              | **\_** s         | ✅ / ❌ |
| Wallet Accounts     | 10s              | **\_** s         | ✅ / ❌ |
| Wallet Sign         | 120s             | **\_** s         | ✅ / ❌ |

### Issues Discovered

1. Issue: ****\*\*****\_****\*\*****
   - Severity: High / Medium / Low
   - Steps to reproduce: ****\*\*****\_****\*\*****
   - Expected: ****\*\*****\_****\*\*****
   - Actual: ****\*\*****\_****\*\*****

2. Issue: ****\*\*****\_****\*\*****
   - Severity: High / Medium / Low
   - Steps to reproduce: ****\*\*****\_****\*\*****
   - Expected: ****\*\*****\_****\*\*****
   - Actual: ****\*\*****\_****\*\*****

### Recommendations

1. ***
2. ***
3. ***

---

## Completion Checklist

After completing all tests:

- [ ] All 24 tests executed
- [ ] Results documented in this guide
- [ ] Screenshots captured for key scenarios
- [ ] Console logs saved for timeout events
- [ ] Issues logged in GitHub (if any)
- [ ] Update `.github/TIMEOUT_IMPLEMENTATION_CHECKLIST.md`
- [ ] Mark Phase 1 testing as complete
- [ ] Share results with team

---

## Next Steps

1. **If all tests pass**:
   - Mark Phase 1 as complete
   - Proceed to Phase 2 (User-Facing Operations)
   - Update documentation

2. **If issues found**:
   - Document issues in detail
   - Adjust timeout values if needed
   - Fix bugs discovered
   - Re-test affected operations

3. **Optimization**:
   - Analyze P95 timing data
   - Consider adjusting timeout values
   - Implement retry UI improvements
   - Add progress indicators

---

**Testing Guide Version**: 1.0  
**Last Updated**: November 2, 2025  
**Estimated Completion Time**: 45-60 minutes  
**Tester**: ****\*\*****\_****\*\*****  
**Date Completed**: ****\*\*****\_****\*\*****

# Connection Flow Testing Script

## Purpose
Verify that wallet and Storacha connections persist correctly across various scenarios.

## Prerequisites
- Development server running (`npm run dev`)
- Talisman or MetaMask installed
- Valid email address for Storacha

## Test Scenarios

### Scenario 1: First Time User - Happy Path

**Steps:**
1. Open app in fresh browser (clear localStorage first)
2. Navigate to Settings page
3. Click "Connect Wallet"
4. Approve in wallet extension
5. Verify green dot appears for wallet in Connection Status
6. Enter email in Storacha section
7. Click "Connect with Storacha"
8. Check email and verify
9. Wait for space creation
10. Verify green dot appears for storage in Connection Status

**Expected Results:**
- ✅ Wallet connects on first try
- ✅ Storacha authenticates successfully
- ✅ Both show green status
- ✅ "All systems ready" message appears

### Scenario 2: Page Refresh - Persistence Test

**Steps:**
1. Complete Scenario 1 first
2. Refresh the page (F5)
3. Check Connection Status

**Expected Results:**
- ✅ Wallet still connected (no popup)
- ✅ Storacha still authenticated
- ✅ Both show green status
- ✅ No reconnection required

### Scenario 3: Browser Restart - Long-term Persistence

**Steps:**
1. Complete Scenario 1 first
2. Close browser completely
3. Reopen browser
4. Navigate to app
5. Check Connection Status

**Expected Results:**
- ✅ Wallet reconnects automatically
- ✅ Storacha session restored
- ✅ Both show green status
- ✅ No user action required

### Scenario 4: Partial Authentication Recovery

**Steps:**
1. Start fresh (clear localStorage)
2. Connect wallet
3. Enter email for Storacha
4. Click "Connect with Storacha"
5. Verify email
6. **Close browser before space creation completes**
7. Reopen browser
8. Navigate to Settings

**Expected Results:**
- ✅ Wallet still connected
- ✅ Storacha shows "Complete Storacha Setup" UI
- ✅ Yellow dot for storage (partial state)
- ✅ Can click "Create Space" to complete
- ✅ After space creation, green dot appears

### Scenario 5: Network Interruption

**Steps:**
1. Start fresh
2. Connect wallet
3. Start Storacha authentication
4. Disconnect internet during email verification
5. Reconnect internet
6. Check status

**Expected Results:**
- ✅ Wallet remains connected
- ✅ Clear error message about network
- ✅ Can retry authentication
- ✅ Previous progress not lost

### Scenario 6: Multiple Tabs

**Steps:**
1. Complete Scenario 1 in Tab A
2. Open app in Tab B
3. Check Connection Status in both tabs

**Expected Results:**
- ✅ Both tabs show connected status
- ✅ No conflicts between tabs
- ✅ Changes in one tab reflect in other

### Scenario 7: Wallet Extension Disabled

**Steps:**
1. Complete Scenario 1
2. Disable wallet extension
3. Refresh page
4. Check Connection Status

**Expected Results:**
- ✅ Shows wallet disconnected
- ✅ Clear error message
- ✅ Storacha remains connected
- ✅ Can reconnect wallet after re-enabling

### Scenario 8: Clear Browser Data

**Steps:**
1. Complete Scenario 1
2. Clear browser data (localStorage)
3. Refresh page
4. Check Connection Status

**Expected Results:**
- ✅ Both connections cleared
- ✅ Shows disconnected state
- ✅ Can reconnect both services
- ✅ No errors or broken state

## Automated Checks

### Console Logs to Monitor

Open browser DevTools (F12) and watch for these logs:

**Wallet Connection:**
```
[WalletProvider] Restoring previous connection
[WalletProvider] Successfully connected: 0x...
```

**Storacha Connection:**
```
Storacha: Attempting to restore space: did:...
Storacha: Space restored successfully
Storacha: Connection restored successfully
```

### localStorage Inspection

Check these keys in DevTools > Application > Local Storage:

```javascript
// Should exist after wallet connection
localStorage.getItem('lockdrop_wallet_connection')
// Expected: {"wasConnected":true}

// Should exist after Storacha auth
localStorage.getItem('lockdrop_storacha_auth')
// Expected: {"isAuthenticated":true,"email":"user@example.com","spaceDid":"did:..."}
```

## Performance Checks

### Page Load Time
- **Before fix:** ~3-5 seconds (with reconnection popups)
- **After fix:** ~1-2 seconds (silent reconnection)

### User Actions Required
- **Before fix:** 3-5 wallet approvals per session
- **After fix:** 1 wallet approval (first time only)

## Regression Tests

### Ensure These Still Work

1. **Message Creation:**
   - Can create time-locked messages
   - Encryption works correctly
   - Upload to IPFS succeeds

2. **Message Unlocking:**
   - Can unlock messages after time
   - Decryption works correctly
   - Media playback works

3. **Dashboard:**
   - Shows sent messages
   - Shows received messages
   - Status updates correctly

## Bug Reporting Template

If you find issues, report with this format:

```
**Scenario:** [Which test scenario]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Console Errors:**
[Any errors from DevTools console]

**localStorage State:**
[Contents of lockdrop_* keys]

**Browser:** [Chrome/Firefox/etc + version]
**Wallet:** [Talisman/MetaMask + version]
```

## Success Criteria

All scenarios should pass with:
- ✅ No unnecessary reconnection prompts
- ✅ Clear status indicators
- ✅ Helpful error messages
- ✅ State persists across sessions
- ✅ Partial state recovery works
- ✅ No console errors

## Notes

- Test in both Chrome and Firefox
- Test with both Talisman and MetaMask
- Test with slow network (DevTools throttling)
- Test with ad blockers enabled/disabled
- Test in private/incognito mode (expect no persistence)

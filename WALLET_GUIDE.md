# Wallet Guide

Complete guide for wallet setup and troubleshooting on Passet Hub.

## Critical Information

**Passet Hub uses Ethereum-format addresses (0x...)**

✅ **USE** Ethereum addresses: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
❌ **DO NOT USE** Substrate addresses: `5E2jTHsQfRCq8wBPeHgwKQAeCMwSsxYCCZfB4dG2SWhp4ZTv`

---

## Wallet Setup

### Option 1: Talisman (Recommended)

1. Install from https://www.talisman.xyz/download
2. Create wallet and save seed phrase
3. **Create Ethereum account** (not Polkadot!):
   - Click "Add Account" or "+"
   - Select **"Ethereum"**
   - Verify address starts with **0x**

### Option 2: MetaMask

1. Install from https://metamask.io/
2. Create wallet and save seed phrase
3. All accounts are Ethereum by default ✅

### Get Testnet Tokens

1. Copy your Ethereum address (0x...)
2. Visit https://faucet.polkadot.io/paseo
3. Paste address and request tokens
4. Wait ~1-2 minutes

---

## Troubleshooting

### Quick Diagnostics

Open browser console (F12) and look for `[WalletProvider]` messages.

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No Ethereum wallet detected" | No extension installed | Install Talisman or MetaMask |
| "Connection rejected" | Clicked Cancel in popup | Click Approve/Connect |
| "No Ethereum accounts found" | Using Polkadot account | Create Ethereum account in Talisman |
| "Wallet connection timed out" | Wallet locked | Unlock wallet extension |
| "Invalid address format" | Using Substrate address (5...) | Use Ethereum account (0x...) |
| "Insufficient balance" | No PAS tokens | Get tokens from faucet |

### Talisman Shows Wrong Address Type

If your address starts with `5...` instead of `0x...`:
1. Open Talisman
2. Create new account
3. Select **"Ethereum"** (NOT Polkadot)
4. Use this new account

### Multiple Wallets Installed

- Talisman usually takes priority over MetaMask
- To use MetaMask: temporarily disable Talisman
- To use Talisman: keep both enabled

### Manual Testing (Browser Console)

```javascript
// Check wallet exists
console.log("Wallet exists:", !!window.ethereum);
console.log("Is Talisman:", window.ethereum?.isTalisman);
console.log("Is MetaMask:", window.ethereum?.isMetaMask);

// Request accounts manually
window.ethereum.request({ method: "eth_requestAccounts" })
  .then(accounts => console.log("Accounts:", accounts))
  .catch(error => console.error("Error:", error));
```

### Reset Connection

**Clear browser state:**
```javascript
localStorage.removeItem("sovseal_wallet_connection");
```

**Reset wallet permissions:**
- Talisman: Settings → Connected Sites → Remove localhost
- MetaMask: Three dots → Connected Sites → Remove localhost

### Check Network/RPC

```javascript
// Test RPC endpoint
fetch("https://testnet-passet-hub-eth-rpc.polkadot.io", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 })
}).then(r => r.json()).then(console.log);
```

---

## Quick Reference

| Wallet | Account Type | Address Format | Works? |
|--------|--------------|----------------|--------|
| MetaMask | Ethereum (default) | 0x... | ✅ Yes |
| Talisman (Ethereum) | Ethereum | 0x... | ✅ Yes |
| Talisman (Polkadot) | Substrate | 5... | ❌ No |

---

## Prevention Tips

1. **Always use Ethereum accounts** (0x...)
2. **Keep wallet unlocked** when using the app
3. **Use one wallet at a time** to avoid conflicts
4. **Check console logs** for detailed errors
5. **Refresh after changes** to wallet or extensions

# User Connection Guide

## Quick Start

### First Time Setup

1. **Connect Your Wallet**
   - Click "Connect Wallet" button
   - Approve the connection in your wallet extension (Talisman or MetaMask)
   - Your wallet will stay connected even after closing the browser

2. **Setup Storage**
   - Enter your email address
   - Check your email and click the verification link
   - Create a space name (or use the default)
   - Click "Connect with Storacha"

3. **You're Ready!**
   - Both connections will persist across browser sessions
   - You can now create and upload time-locked messages

## Connection Status

Check your connection status anytime in the Settings page:

- **Green dot** = Connected and working
- **Yellow dot** = Partially connected (needs attention)
- **Gray dot** = Not connected

## Common Issues & Solutions

### "Wallet keeps disconnecting"
**Solution:** This has been fixed! Your wallet now stays connected. If you're still experiencing this:
1. Make sure you're using the latest version
2. Try disconnecting and reconnecting once
3. Check that your wallet extension is enabled

### "Email verified but can't upload"
**Solution:** You need to complete the space creation:
1. Go to Settings
2. Look for "Complete Storacha Setup" section
3. Click "Create Space"

### "Lost connection after closing browser"
**Solution:** This should no longer happen! Connections now persist. If you're experiencing this:
1. Clear your browser cache
2. Reconnect both wallet and storage
3. Connections will persist from then on

### "Multiple connection popups"
**Solution:** This was a bug that's now fixed. You should only see:
- One wallet popup on first connection
- One email verification for Storacha
- No popups on subsequent visits

## Understanding Connection States

### Wallet States
- **Not Connected:** Click "Connect Wallet" to start
- **Connected:** Green indicator, shows your address
- **Reconnecting:** Happens automatically on page load

### Storage States
- **Not Connected:** Need to authenticate with email
- **Email Verified:** Need to create a space
- **Ready:** Green indicator, can upload files

## Tips for Best Experience

1. **Keep Extensions Updated**
   - Update Talisman/MetaMask regularly
   - Restart browser after extension updates

2. **Use One Browser Tab**
   - Multiple tabs can cause connection conflicts
   - Close other tabs when connecting

3. **Check Settings First**
   - Visit Settings page to see connection status
   - Resolve any yellow indicators before creating messages

4. **Stable Internet Connection**
   - Email verification requires internet
   - File uploads need stable connection

## Privacy & Security

### What's Stored Locally?
- Wallet connection preference (not your private keys!)
- Storacha email and space ID (not your files!)
- No sensitive data is stored in localStorage

### What Requires Approval?
- First wallet connection (one-time)
- Email verification (one-time)
- Every transaction signature (for security)

### What Happens Automatically?
- Wallet reconnection on page load
- Storacha session restoration
- Connection health checks

## Troubleshooting Steps

If you're having connection issues:

1. **Check Browser Console**
   - Press F12 to open developer tools
   - Look for error messages in Console tab

2. **Clear and Reconnect**
   - Go to Settings
   - Click "Reset Connection" for Storacha
   - Disconnect and reconnect wallet
   - Try the flow again

3. **Check Extension Status**
   - Make sure wallet extension is unlocked
   - Verify extension has permission for this site
   - Try disabling/enabling the extension

4. **Browser Compatibility**
   - Use Chrome, Firefox, or Brave
   - Enable third-party cookies for this site
   - Disable strict tracking protection

## Getting Help

If you're still having issues:

1. Check the [GitHub Issues](https://github.com/your-repo/issues)
2. Join our [Discord community](https://discord.gg/your-invite)
3. Review the [Technical Documentation](./CONNECTION_IMPROVEMENTS.md)

## What Changed?

If you used the app before these improvements:

- **You'll need to reconnect once** - After that, connections persist
- **Better error messages** - Clear guidance when something goes wrong
- **Visual status indicators** - Always know what's connected
- **Partial state recovery** - Don't lose progress if something fails

The new system is much more reliable and user-friendly!

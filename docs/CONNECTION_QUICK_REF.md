# Connection State Management - Quick Reference

## For Developers

### Wallet Connection

**Check if connected:**
```typescript
import { useWallet } from '@/lib/wallet/WalletProvider';

const { isConnected, address } = useWallet();
```

**Connect wallet:**
```typescript
const { connect } = useWallet();
await connect();
```

**Listen for connection changes:**
```typescript
const { onConnectionChange } = useWallet();

useEffect(() => {
  const unsubscribe = onConnectionChange((connected) => {
    console.log('Wallet connected:', connected);
  });
  return unsubscribe;
}, [onConnectionChange]);
```

### Storacha Connection

**Check if ready:**
```typescript
import { useStoracha } from '@/hooks/useStoracha';

const { isReady, authState } = useStoracha();
```

**Authenticate:**
```typescript
const { login, createSpace } = useStoracha();

// Step 1: Email authentication
await login('user@example.com');

// Step 2: Create space
await createSpace('my-space');
```

**Check connection status:**
```typescript
import { storachaService } from '@/lib/storage';

const status = await storachaService.checkConnection();
// Returns: { canRestore, needsSpace, needsAuth }
```

### Connection Status Component

**Display unified status:**
```typescript
import { ConnectionStatus } from '@/components/storage';

<ConnectionStatus className="mb-4" />
```

### localStorage Keys

**Wallet:**
```typescript
const WALLET_KEY = 'lockdrop_wallet_connection';
// Stores: { wasConnected: boolean }
```

**Storacha:**
```typescript
const STORACHA_KEY = 'lockdrop_storacha_auth';
// Stores: { isAuthenticated: boolean, email?: string, spaceDid?: string }
```

### Common Patterns

**Require both connections:**
```typescript
const { isConnected: walletConnected } = useWallet();
const { isReady: storageReady } = useStoracha();

if (!walletConnected) {
  return <div>Please connect your wallet</div>;
}

if (!storageReady) {
  return <div>Please setup storage</div>;
}

// Both connected, proceed with operation
```

**Handle connection errors:**
```typescript
try {
  await connect();
} catch (error) {
  if (error.message.includes('User rejected')) {
    // User cancelled
  } else if (error.message.includes('timeout')) {
    // Connection timed out
  } else {
    // Other error
  }
}
```

**Silent reconnection:**
```typescript
// Wallet reconnects automatically on mount
// No action needed in components

// Storacha reconnects automatically on mount
// No action needed in components
```

### Testing Helpers

**Clear connection state:**
```typescript
// For testing only
localStorage.removeItem('lockdrop_wallet_connection');
localStorage.removeItem('lockdrop_storacha_auth');
```

**Mock connection state:**
```typescript
// For testing only
localStorage.setItem('lockdrop_wallet_connection', 
  JSON.stringify({ wasConnected: true }));

localStorage.setItem('lockdrop_storacha_auth',
  JSON.stringify({ 
    isAuthenticated: true, 
    email: 'test@example.com',
    spaceDid: 'did:key:test123'
  }));
```

### Debugging

**Enable verbose logging:**
```typescript
// Check browser console for these logs:
// [WalletProvider] ...
// Storacha: ...
```

**Inspect connection state:**
```typescript
// In browser console:
console.log('Wallet:', localStorage.getItem('lockdrop_wallet_connection'));
console.log('Storacha:', localStorage.getItem('lockdrop_storacha_auth'));
```

### Best Practices

1. **Always check connection before operations:**
   ```typescript
   if (!isConnected) {
     throw new Error('Wallet not connected');
   }
   ```

2. **Provide clear error messages:**
   ```typescript
   catch (error) {
     setError('Failed to connect. Please try again.');
   }
   ```

3. **Show connection status:**
   ```typescript
   <ConnectionStatus />
   ```

4. **Handle partial states:**
   ```typescript
   if (authState.isAuthenticated && !authState.spaceDid) {
     // Show space creation UI
   }
   ```

5. **Don't block on connection:**
   ```typescript
   // Let users explore app while disconnected
   // Only require connection for specific operations
   ```

### Migration Guide

**From old code:**
```typescript
// Old: Connection lost on refresh
useEffect(() => {
  // Had to reconnect every time
  connect();
}, []);
```

**To new code:**
```typescript
// New: Connection persists automatically
// No useEffect needed!
// Just check isConnected when needed
```

### API Reference

**WalletProvider:**
- `isConnected: boolean` - Connection status
- `address: string | null` - Current address
- `connect(): Promise<void>` - Connect wallet
- `disconnect(): void` - Disconnect wallet
- `onConnectionChange(callback): () => void` - Listen for changes

**useStoracha:**
- `isReady: boolean` - Ready for uploads
- `authState: AuthState` - Current auth state
- `login(email): Promise<boolean>` - Authenticate
- `createSpace(name): Promise<string | null>` - Create space
- `uploadFile(blob, filename): Promise<result | null>` - Upload file

**StorachaService:**
- `getAuthState(): AuthState` - Get current state
- `isReady(): boolean` - Check if ready
- `checkConnection(): Promise<status>` - Verify connection
- `logout(): void` - Clear auth state

### Troubleshooting

**Wallet won't connect:**
1. Check extension is installed and unlocked
2. Check browser console for errors
3. Try disconnect/reconnect
4. Clear localStorage and try again

**Storacha won't authenticate:**
1. Check email was verified
2. Check browser console for errors
3. Try logout and re-authenticate
4. Check network connection

**State not persisting:**
1. Check localStorage is enabled
2. Check not in private/incognito mode
3. Check browser isn't clearing data
4. Check console for errors

### Performance Tips

1. **Lazy load connections:**
   ```typescript
   // Only connect when needed
   const handleAction = async () => {
     if (!isConnected) await connect();
     // Proceed with action
   };
   ```

2. **Batch operations:**
   ```typescript
   // Don't reconnect for each operation
   if (isConnected) {
     await operation1();
     await operation2();
     await operation3();
   }
   ```

3. **Cache connection status:**
   ```typescript
   // Use React state, don't check localStorage repeatedly
   const { isConnected } = useWallet(); // Cached in context
   ```

### Security Notes

- Never store private keys in localStorage
- Only store connection preferences
- Always require user approval for transactions
- Use silent reconnection for read-only operations
- Clear sensitive data on logout

### Related Documentation

- [User Guide](USER_CONNECTION_GUIDE.md)
- [Technical Details](CONNECTION_IMPROVEMENTS.md)
- [Testing Script](../scripts/test-connection-flow.md)
- [Changelog](../CHANGELOG_CONNECTION_FIX.md)

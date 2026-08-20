# DemoData common files

Folder: `src/DemoData/files`

| File | Purpose |
|------|---------|
| `demoData.common.ts` | Shared constants: headers, ID starts, roles, AsyncStorage keys |
| `index.ts` | Barrel export — `import { … } from '@/DemoData/files'` |

Local device stores (not Google Sheets) hold UserDetails, Vehicles, Notifications, Chat, Wallet, Rides, Bookings, and BankAccounts.

```ts
import {
  DEMO_STORAGE_KEYS,
  WALLET_TRANSACTIONS_SHEET_HEADERS,
} from '@/DemoData/files';
```

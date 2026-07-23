<!-- cspell:words Gasmaster ritir -->

# How to do it right with Viem + Particle

This manual provides the definitive architectural pattern for 2026 to achieve **full type safety**, **social onboarding**, and **gasless transactions** using **Particle Network ConnectKit 2.0** and **Viem v2+**.

## **Developers Manual: The "Zero-Typo" Stack**

### **1. Core Configuration**
In 2026, Particle has unified its SDKs. You no longer need separate "Auth" and "AA" packages for basic usage; `@particle-network/connectkit` handles the full lifecycle.

**Installation:**
```bash
npm install @particle-network/connectkit viem@latest
```

**Setup (`ConnectKit.tsx`):**
Enable the **Smart Account** (AA) and **Paymaster** (Gasmaster) directly in the config.

```typescript
import { ConnectKitProvider, createConfig } from '@particle-network/connectkit';
import { authWalletConnectors } from '@particle-network/connectkit/auth';
import { baseSepolia } from '@particle-network/connectkit/chains';

const config = createConfig({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
  clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
  appId: process.env.NEXT_PUBLIC_APP_ID!,
  chains: [baseSepolia],
  walletConnectors: [
    authWalletConnectors({ 
      authTypes: ['google', 'apple', 'email'], // Targeted social login
      fiatCoin: 'USD',
      promptSettingConfig: { // No lock-in: users can always export their keys
        promptMasterPasswordSettingWhenLogin: 1,
        promptPaymentPasswordSettingWhenSign: 1,
      }
    }),
  ],
  aaOptions: {
    accountContracts: {
      SIMPLE: [{ version: '2.0.0', chainIds: [baseSepolia.id] }],
    },
  },
});
```

---

### **2. The Bridge: Connecting AA to Viem**
To get the `contract.write.retire()` syntax with compile-time checks, you must wrap the **Particle Smart Account** into a standard Viem **Wallet Client**.

```typescript
import { useSmartAccount } from '@particle-network/connectkit';
import { createWalletClient, custom, getContract } from 'viem';
import { baseSepolia } from 'viem/chains';
import { AAWrapProvider, SendTransactionMode } from '@particle-network/aa';

export const useTypeSafeContract = () => {
  const smartAccount = useSmartAccount(); // The AA instance

  // 1. Define ABI with 'as const' to enable IDE autocompletion
  const MY_ABI = [
    {
      name: "retire",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [{ name: "amount", type: "uint256" }],
    }
  ] as const;

  const getRetireContract = () => {
    if (!smartAccount) return null;

    // 2. Wrap the Smart Account as an EIP-1193 Provider
    // Set 'Gasless' mode to automatically trigger the Paymaster
    const eip1193Provider = new AAWrapProvider(smartAccount, SendTransactionMode.Gasless);

    // 3. Create the Viem Wallet Client
    const walletClient = createWalletClient({
      chain: baseSepolia,
      transport: custom(eip1193Provider),
      account: smartAccount.address as `0x${string}`,
    });

    // 4. Return the typed contract instance
    return getContract({
      address: '0xYourContractAddress',
      abi: MY_ABI,
      client: { wallet: walletClient }
    });
  };

  return { getRetireContract };
};
```

---

### **3. Implementation: The "Clean Call"**
Now, your component logic is identical to a standard Web3 app, but it is actually executing a **social-login-powered, gas-sponsored, smart-account transaction**.

```typescript
const MyComponent = () => {
  const { getRetireContract } = useTypeSafeContract();

  const handleRetire = async (amount: bigint) => {
    const contract = getRetireContract();
    if (!contract) return;

    try {
      // IDE will error if you type "ritir" or pass a string instead of bigint
      const hash = await contract.write.retire([amount]); 
      console.log("Success! Sponsored TX Hash:", hash);
    } catch (error) {
      console.error("TX Failed:", error);
    }
  };

  return <button onClick={() => handleRetire(100n)}>Retire 100 Tokens</button>;
};
```

---

### **4. Summary of Developer Protections**

| Potential Error | How this stack catches it |
| :--- | :--- |
| **Typo in `retire`** | **TypeScript Error:** Property `ritir` does not exist on type... |
| **Wrong Data Type** | **TypeScript Error:** `string` is not assignable to `bigint`. |
| **Missing Argument** | **TypeScript Error:** Expected 1 argument, but got 0. |
| **User has no Gas** | **Automated:** Particle's `Gasless` mode routes the call to the Paymaster. |
| **Lock-in Fear** | **Feature:** User can access the Particle Dashboard to export their private key. |

### **Next Steps**
1. **Deposit Gas:** Go to the [Particle Dashboard](https://dashboard.particle.network) and deposit native tokens into your **Paymaster** to start sponsoring user transactions.
2. **Setup Policies:** Configure "Gas Policies" in the dashboard to restrict which contract functions (like `retire`) you are willing to pay for.


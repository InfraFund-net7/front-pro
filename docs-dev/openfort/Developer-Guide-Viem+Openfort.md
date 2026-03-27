This manual details the architecture for building a **sovereign, non-custodial** application in 2026 using **Openfort** and **Viem**. This stack is ideal for developers who prioritize **infrastructure ownership** (no vendor lock-in), **social onboarding**, and **strict TypeScript safety**.

## **Developers Manual: The Sovereign Stack (Viem + Openfort)**

### **1. Core Configuration**
Openfort's 2026 SDK focuses on **OpenSigner**, their self-hostable key management layer. To start, you'll need your `Publishable Key` from the Openfort Dashboard and a `Policy ID` to sponsor gas.

**Installation:**
```bash
npm install @openfort/openfort-js viem@latest
```

**Initialization (`OpenfortConfig.ts`):**
```typescript
import { Openfort } from '@openfort/openfort-js';

export const openfort = new Openfort({
  baseConfiguration: {
    publishableKey: process.env.NEXT_PUBLIC_OPENFORT_KEY!,
  },
  shieldConfiguration: {
    shieldPublishableKey: process.env.NEXT_PUBLIC_SHIELD_KEY!,
  },
});
```

---

### **2. The Bridge: Wrapping Openfort into Viem**
To achieve the `contract.write.retire()` syntax, we wrap the Openfort **Smart Account** into a standard Viem **Wallet Client**. This allows Viem to handle the type-checking while Openfort handles the signature and gas sponsorship.

```typescript
import { createWalletClient, custom, getContract } from 'viem';
import { base } from 'viem/chains';

export const useSovereignContract = () => {
  // 1. Define ABI with 'as const' for the "No-Typo" guarantee
  const MY_ABI = [
    {
      name: "retire",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [{ name: "amount", type: "uint256" }],
    }
  ] as const;

  const getTypedContract = async (policyId: string) => {
    // 2. Get the EIP-1193 provider from Openfort
    // We pass the Policy ID here to enable gasless transactions automatically
    const provider = await openfort.getEthereumProvider({ 
      policy: policyId 
    });

    // 3. Create the Viem Wallet Client
    const walletClient = createWalletClient({
      chain: base,
      transport: custom(provider),
    });

    // 4. Return the fully typed contract instance
    return getContract({
      address: '0xYourContractAddress',
      abi: MY_ABI,
      client: { wallet: walletClient }
    });
  };

  return { getTypedContract };
};
```

---

### **3. Implementation: Executing the Call**
Your application logic remains "pure." TypeScript will validate your function names and arguments against the ABI at **compile time**.

```typescript
const RetirementApp = () => {
  const { getTypedContract } = useSovereignContract();

  const handleRetire = async (amountInWei: bigint) => {
    // 'pol_...' is your Gasmaster policy from the dashboard
    const contract = await getTypedContract("pol_v2_12345"); 

    try {
      // ❌ IDE Error: Property 'ritir' does not exist... (Typo protection)
      // ❌ IDE Error: Argument type 'number' not assignable to 'bigint'
      const hash = await contract.write.retire([amountInWei]); 
      
      console.log("Success! Gas sponsored by Openfort Policy. Hash:", hash);
    } catch (err) {
      console.error("Transaction aborted:", err);
    }
  };

  return <button onClick={() => handleRetire(500n)}>Retire 500 Units</button>;
};
```

---

### **4. Gas Sponsorship (The "Policy Engine")**
In the Openfort Dashboard (2026 Policy V2), you create "Gasmaster" rules. This replaces the need for users to hold ETH:
* **Whitelisting:** Only allow the `retire` function to be sponsored.
* **Rate Limiting:** Sponsor up to 5 transactions per user per day.
* **Fixed Fees:** Pay for gas using a credit card or a pre-deposited stablecoin balance.

---

### **5. The "No Lock-in" Protocol**
Openfort is the only major provider that solves the "Lock-in" problem in two ways:

1.  **OpenSigner (Self-Hosting):** If you grow large enough that you don't want to rely on Openfort's cloud, you can deploy the **OpenSigner** stack on your own AWS/GCP instance. Your users' wallet addresses **stay the same**.
2.  **Key Export:** You can trigger a secure "Key Export" flow within your app:
    ```typescript
    // This opens a secure iframe for the user to see their private key/seed
    await openfort.exportPrivateKey(); 
    ```
    This allows a user to "eject" from your app and import their wallet into MetaMask or any other EVM wallet at any time.

### **Summary of Benefits**
* **Strict Typing:** Zero chance of `ritir` typos thanks to Viem's `as const` ABI inference.
* **Developer Choice:** You aren't forced into a proprietary SDK; you use standard Viem patterns.
* **User Freedom:** Social logins provide the "Web2" feel, but the "Export" feature ensures they own their assets.

## Foolow-up Questions


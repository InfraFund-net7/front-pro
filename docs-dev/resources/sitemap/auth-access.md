# Auth & Access

Source: [InfraFund-local](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local)

| Sitemap ID | Title | Role(s) | Type | Route / target route | Figma node | Related nodes | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| auth-wallet-connect-start | Connect your wallet | Public, Client, Investor | Page | `/auth/connect-wallet` or gated tokenization step | [`13:12068`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-12068) | `13:13242`, `13:13344`, `13:13420`, `13:13522`, `13:13624` | mapped | Primary wallet onboarding entry before tokenization. |
| auth-wallet-connect-methods | Connect your wallet / Connect wallet | Public, Client, Investor | Modal or page state | `/auth/connect-wallet/methods` | [`13:13242`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-13242) | `13:13420`, `13:13522`, `13:13624` | mapped | Wallet method selection with Magic Link and WalletConnect messaging. |
| auth-wallet-connect-success | Wallet connected success | Public, Client, Investor | Success state | `/auth/connect-wallet/success` | [`13:13344`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-13344) | `13:13242` | mapped | Completion state after wallet connection. |
| auth-wallet-connect-hover-a | Connect wallet hover state A | Public, Client, Investor | Hover state | n/a | [`13:13420`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-13420) | `13:13522`, `13:13624`, `13:13242` | mapped | Variant state for connection options. |
| auth-wallet-connect-hover-b | Connect wallet hover state B | Public, Client, Investor | Hover state | n/a | [`13:13522`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-13522) | `13:13420`, `13:13624`, `13:13242` | mapped | Variant state for connection options. |
| auth-wallet-connect-hover-c | Connect wallet hover state C | Public, Client, Investor | Hover state | n/a | [`13:13624`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-13624) | `13:13420`, `13:13522`, `13:13242` | mapped | Variant state for connection options. |
| auth-login-register | Login / register flows | Public | Flow | `/login`, `/register`, `/forgot-password` | n/a | n/a | needs-triage | Current metadata export did not surface clearly named auth screens beyond wallet access. |
| auth-terms-consent | Terms and conditions acceptance | Public | Interaction requirement | shared | [`13:13242`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-13242) | `13:13420`, `13:13522`, `13:13624` | mapped | Consent copy is embedded in wallet connection state. |

<!-- cspell:words wireframes -->

# Advanced / Optional

Source: [InfraFund-local](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local)

| Sitemap ID | Title | Role(s) | Type | Route / target route | Figma node | Related nodes | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| advanced-tokenization-start | Tokenization | Client, Investor | Flow entry | `/tokenization` | [`13:10577`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-10577) | `13:12007`, `13:13168` | mapped | High-level tokenization entry selecting asset type. |
| advanced-tokenization-network | Tokenization / Select a network | Client, Investor | Step | `/tokenization/network` | [`13:12007`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-12007) | `13:11789`, `13:11865`, `13:11941`, `13:13168` | mapped | Network selection step with multiple feature-hover states. |
| advanced-tokenization-network-confirm | Tokenization / Confirm select a network | Client, Investor | Step | `/tokenization/network/confirm` | [`13:13168`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-13168) | `13:12007` | mapped | Confirmation state after selecting the tokenization network. |
| advanced-pre-minting-required | Pre-minting required steps | Client, Investor | Flow | `/tokenization/pre-minting` | [`13:12743`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-12743) | `13:12856`, `13:12970`, `13:13080` | mapped | Pre-minting onboarding and token preparation steps. |
| advanced-pre-minting-get-inf | Pre-minting / Get $INF | Client, Investor | Step | `/tokenization/pre-minting/get-inf` | [`13:12970`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-12970) | `13:12743`, `13:12856`, `13:13080` | mapped | Sub-step inside pre-minting guidance. |
| advanced-wireframe-v2 | Dashboard V2 wireframes | Mixed | Wireframe cluster | n/a | [`13:13739`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=13-13739) | `13:13794`, `13:13849`, `13:10523` | mapped | Early wireframe or concept screens kept separate from implementation-ready flows. |
| advanced-asset-class-sections | Asset-class repeated sections | Mixed | Section cluster | n/a | [`703:33676`](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=703-33676) | `703:33674`, `703:42446`, `703:51216` | mapped | Large repeated sections for Pre-sale, Loan, Equity, and Debt. Useful for pattern discovery more than direct implementation. |

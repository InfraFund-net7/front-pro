# InfraFund sitemap

Source Figma file: [InfraFund-local](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local)

This directory stores a role- and topic-oriented sitemap derived from the Figma file. Each entry keeps the primary Figma node ID so you can search here first, then pass the node to Figma MCP when implementing or reviewing a screen.

## Files

- `auth-access.md`
- `client-flow.md`
- `investor-flow.md`
- `dao.md`
- `gc.md`
- `admin-panel.md`
- `advanced-optional.md`
- `settings.md`

## Conventions

| Field | Meaning |
|---|---|
| Sitemap ID | Stable repo-owned reference slug |
| Title | Screen, flow, or modal name |
| Role(s) | Likely primary role or audience |
| Type | Page, flow, modal, step, state, section |
| Route / target route | Existing or proposed route anchor |
| Figma node | Primary node ID |
| Related nodes | Variants, hover states, duplicates, or follow-up steps |
| Status | `mapped`, `needs-triage`, `duplicate-cluster`, `empty-placeholder` |
| Notes | Search hints or implementation context |

## How to use

1. Search this directory for a role, feature, or screen name.
2. Copy the `Figma node` ID.
3. Pass that node ID into Figma MCP tools such as `get_design_context`.
4. Use `Related nodes` when you need hover, success, confirm, scroll, or alternate states.

## Notes

- The Figma file contains repeated sections for asset classes such as `Loan`, `Pre-sale`, `Equity`, and `Debt`. Where repeated screens are structurally similar, this sitemap records the primary pattern and links the repeated sections under related nodes or notes.
- Several areas are not clearly labeled in the current file export. Those are intentionally marked as `needs-triage` instead of being guessed.
- Empty domain files are included where the current Figma metadata did not expose a clear corresponding area yet.

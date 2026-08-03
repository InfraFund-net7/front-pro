# openfort resources

website : https://www.openfort.io

documentation : https://www.openfort.io/docs/overview
(If it returns HTML, just append `.md` to the URL to get markdown)

## Information for AI agents implementing openfort

https://www.openfort.io/docs/overview/building-with-ai

Server-side token validation / backend session exchange:

https://www.openfort.io/docs/products/server/access-token

User session behavior:

https://www.openfort.io/docs/configuration/user-sessions


## openfort CLI

openfort has a CLI which is installed and authenticated
Should authentication fail, stop and ask user to fix authentication before moving on.

https://www.openfort.io/docs/overview/building-with-cli


## openfort skill

The Agent should have openfort skills already installed with `npx skills add openfort-xyz/agent-skills --skill openfort`


## openfort MCP server

openfort provides 2 MCP server, however they are not installed currently as we assume that the website provides all documentation in markdown and all commands can be executed using the `openfort` CLI.

https://www.openfort.io/docs/overview/building-with-ai#mcp-server


## additional resources (local files relative to project root)

`docs-dev/openfort/openfort-embedded-wallet-setup.md`

`docs-dev/openfort/Developer-Guide-Viem+Openfort.md`

If you find an error in these 2 files or official latest openfort documentation says different then update these files 


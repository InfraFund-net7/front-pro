<!-- cspell:words InfraFund project_owner -->

# Role and Menu Mapping

InfraFund stores the logged-in account role and account type on the backend user record. The onboarding UI still uses product-facing labels, then `src/server/services/auth.ts` normalizes them before persistence: `client` becomes `project_owner`, `dao` becomes `governance`, and direct roles such as `investor`, `contractor`, and `auditor` are stored as-is.

The sidebar menu is defined as one ordered registry in `src/components/sidebar.tsx`. The order of entries in `NAVIGATION_ITEMS` is the order shown in the UI, so moving a menu item only requires moving that object in the list.

Each menu item can declare `roles` and `types`. If no restriction is present, the item is visible to every authenticated account. If restrictions are present, the resolver compares them with `backendUser.role` and `backendUser.type`; non-matching items are hidden rather than shown disabled.

Pages and APIs still enforce their own authorization. The menu only decides whether a route should be visible for a role/type combination; the route itself decides what data and actions the current account can access.

Project membership is modeled separately through `ProjectAccountRole`, which links account, project, and role. This allows one account to hold different roles on different projects while preserving `Project.ownerUserId` for project ownership compatibility.

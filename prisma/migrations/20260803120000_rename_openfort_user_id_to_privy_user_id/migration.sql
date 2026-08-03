-- Rename openfort_user_id to privy_user_id: this column has stored Privy
-- user IDs since the Openfort-to-Privy auth migration; only the name was
-- never updated.
ALTER TABLE "users" RENAME COLUMN "openfort_user_id" TO "privy_user_id";
ALTER INDEX "users_openfort_user_id_key" RENAME TO "users_privy_user_id_key";

import { z } from 'zod';
import { isAddress } from 'viem';

export const transactionSchema = z.object({
  toAddress: z
    .string()
    .min(1, 'Recipient address is required')
    .refine((val) => isAddress(val as `0x${string}`), {
      message: 'Invalid ETH address (must start with 0x...)',
    }),
  amount: z
    .coerce
    .number()
    .positive('Amount must be positive')
    .gte(0.000001, 'Minimum amount is 0.000001 ETH'),
});

export type TransactionData = z.infer<typeof transactionSchema>;
import 'server-only';

export function serializeDecimal(
  value: { toString: () => string } | null | undefined
) {
  return value?.toString() ?? null;
}

export function serializeDate(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

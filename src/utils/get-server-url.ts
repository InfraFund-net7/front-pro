export function getServerUrl(url: string | undefined) {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.SERVER_URL?.trim();
  if (!base) return '';
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = (url ?? '').replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}

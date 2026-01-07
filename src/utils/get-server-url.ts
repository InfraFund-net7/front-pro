export function getServerUrl(url: string | undefined) {
  return `${process.env.SERVER_URL}/${url ?? ''}`;
}

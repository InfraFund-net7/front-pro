/** Terms / privacy URLs for auth UI (Openfort modal + InfraFund legal pages). */
export function landingLegalUrls(): { terms: string; privacy: string } {
  const base = process.env.NEXT_PUBLIC_LANDING_URL?.replace(/\/$/, '') ?? '';
  if (base) {
    return { terms: `${base}/terms`, privacy: `${base}/privacy` };
  }
  return {
    terms: 'https://www.infrafund.net/terms',
    privacy: 'https://www.infrafund.net/privacy',
  };
}

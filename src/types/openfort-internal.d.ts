declare module 'openfort-internal-connect-modal';

declare module 'infrafund-landing-legal-urls' {
  export function landingLegalUrls(): { terms: string; privacy: string };
}

declare module 'openfort-ui-provider-context' {
  import type { ReactNode } from 'react';

  export function useOpenfort(): {
    uiConfig: {
      termsOfServiceUrl?: string;
      privacyPolicyUrl?: string;
      disclaimer?: ReactNode | string;
    };
  };
}

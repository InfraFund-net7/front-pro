'use client';

import { landingLegalUrls } from 'infrafund-landing-legal-urls';
import { useOpenfort } from 'openfort-ui-provider-context';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

type Props = { showDisclaimer?: boolean };

/**
 * Drop-in replacement for @openfort/react PoweredByFooter: same disclaimer behaviour
 * (uses uiConfig terms / privacy URLs) but no outbound link to Openfort marketing.
 */
export default function InfraPoweredByFooter({ showDisclaimer }: Props) {
  const { uiConfig: options } = useOpenfort();
  const defaults = useMemo(() => landingLegalUrls(), []);
  const terms = options?.termsOfServiceUrl ?? defaults.terms;
  const privacy = options?.privacyPolicyUrl ?? defaults.privacy;

  const disclaimer: ReactNode = options?.disclaimer ? (
    typeof options.disclaimer === 'string' ? (
      options.disclaimer
    ) : (
      (options.disclaimer as ReactNode)
    )
  ) : (
    <div>
      {'By logging in, you agree to our'}{' '}
      <a href={terms} target="_blank" rel="noopener noreferrer">
        Terms of Service
      </a>{' '}
      {'&'}{' '}
      <a href={privacy} target="_blank" rel="noopener noreferrer">
        Privacy Policy
      </a>
      .
    </div>
  );

  return (
    <div className="mt-1 -mb-4 flex flex-col items-center text-center text-[color:var(--ck-body-color-muted,#888)]">
      {showDisclaimer ? (
        <div className="px-[50px] pt-2 text-center text-[length:var(--ck-body-disclaimer-font-size,10px)] font-[var(--ck-body-disclaimer-font-weight,400)] leading-4 text-[color:var(--ck-body-color-muted,inherit)] [&_a]:font-[var(--ck-body-disclaimer-font-weight,400)] [&_a]:no-underline [&_a]:transition-colors [&_a]:duration-200 [&_a]:ease-in-out">
          {disclaimer}
        </div>
      ) : null}
      <div className="inline-flex h-[42px] select-none items-center justify-center gap-1.5 px-4 text-[15px] font-medium leading-[18px]">
        <span>Secured with</span>
        <span className="font-semibold">Openfort</span>
      </div>
    </div>
  );
}

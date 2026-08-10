/* cspell:words grecaptcha */
'use client';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

export async function getRecaptchaToken(action: string) {
  if (typeof window === 'undefined') {
    throw new Error('Window is unavailable.');
  }

  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA is not loaded.');
  }

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    throw new Error('reCAPTCHA site key is missing.');
  }

  return new Promise<string>((resolve, reject) => {
    window.grecaptcha?.ready(() => {
      window.grecaptcha
        ?.execute(siteKey, { action })
        .then(resolve)
        .catch(reject);
    });
  });
}

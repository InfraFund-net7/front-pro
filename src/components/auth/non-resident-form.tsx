'use client';

import {
  getCountries,
  submitNonResidentCompany,
  submitNonResidentIndividual,
  type CountryOption,
} from '@/lib/backend-auth-client';
import { CustomButton } from '@/components/ui/custom-button';
import { Dropdown } from '@/components/ui/dropdown';
import { FormInput } from '@/components/ui/form-input';
import { getRecaptchaToken } from '@/utils/recaptcha';
import { useEffect, useMemo, useState } from 'react';

interface PrivyUserDetails {
  email?: string | null;
  name?: string | null;
}

interface NonResidentFormProps {
  type: 'individual' | 'organization';
  privyUser?: PrivyUserDetails | null;
  onSuccess: () => void | Promise<void>;
}

function splitName(fullName?: string | null) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function NonResidentForm({
  type,
  privyUser,
  onSuccess,
}: NonResidentFormProps) {
  const defaultName = useMemo(() => splitName(privyUser?.name), [privyUser]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [countryError, setCountryError] = useState<string | null>(null);
  const [countryId, setCountryId] = useState('');
  const [email, setEmail] = useState(privyUser?.email || '');
  const [firstName, setFirstName] = useState(defaultName.firstName);
  const [lastName, setLastName] = useState(defaultName.lastName);
  const [contactFullName, setContactFullName] = useState(privyUser?.name || '');
  const [companyName, setCompanyName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const contactName = useMemo(
    () => splitName(contactFullName),
    [contactFullName]
  );

  useEffect(() => {
    setEmail(privyUser?.email || '');
    setFirstName(defaultName.firstName);
    setLastName(defaultName.lastName);
    setContactFullName(privyUser?.name || '');
  }, [defaultName.firstName, defaultName.lastName, privyUser]);

  useEffect(() => {
    let isMounted = true;

    async function loadCountries() {
      setIsLoadingCountries(true);
      setCountryError(null);

      try {
        const items = await getCountries();

        if (!isMounted) {
          return;
        }

        setCountries(items);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCountryError(
          error instanceof Error
            ? error.message
            : 'Unable to load countries right now.'
        );
      } finally {
        if (isMounted) {
          setIsLoadingCountries(false);
        }
      }
    }

    void loadCountries();

    return () => {
      isMounted = false;
    };
  }, []);

  const disclaimer =
    type === 'individual'
      ? 'Unfortunately, at this point in time, we cannot accept investments from people who are not UK residents or do not have a valid UK national insurance number.'
      : 'Unfortunately, at this point in time, we cannot accept investments from organizations that are not based in the UK or do not meet the current requirements.';
  const hasFullContactName =
    type === 'organization'
      ? Boolean(contactName.firstName.trim() && contactName.lastName.trim())
      : true;

  const isValid =
    type === 'individual'
      ? Boolean(
          firstName.trim() &&
          lastName.trim() &&
          email.trim() &&
          countryId &&
          !isSubmitting
        )
      : Boolean(
          contactFullName.trim() &&
          hasFullContactName &&
          companyName.trim() &&
          email.trim() &&
          countryId &&
          !isSubmitting
        );

  async function handleSubmit() {
    if (!isValid) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const captchaToken = await getRecaptchaToken('non_resident_waitlist');

      if (type === 'individual') {
        await submitNonResidentIndividual(
          {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim().toLowerCase(),
            country_id: Number(countryId),
          },
          captchaToken
        );
      } else {
        await submitNonResidentCompany(
          {
            first_name: contactName.firstName.trim(),
            last_name: contactName.lastName.trim(),
            company_name: companyName.trim(),
            email: email.trim().toLowerCase(),
            country_id: Number(countryId),
          },
          captchaToken
        );
      }

      setIsSubmitted(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await onSuccess();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to submit the form.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex w-full flex-col gap-6 py-4 text-left text-white">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold">Thank you</h3>
          <p className="text-sm text-[#C7CAD5]">
            We&apos;ll keep your details on file and reach out when InfraFund is
            available in your market.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 py-2 text-left text-white">
      <div className="space-y-2">
        <p className="text-sm text-[#C7CAD5]">{disclaimer}</p>
        <p className="text-sm font-semibold text-[#C7CAD5]">
          If you would like to be notified when we are able to accept
          investments from your country, complete the form below.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        {type === 'individual' ? (
          <>
            <FormInput
              label="First Name"
              placeholder="First Name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              invalid={!firstName.trim()}
            />
            <FormInput
              label="Last Name"
              placeholder="Last Name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              invalid={!lastName.trim()}
            />
          </>
        ) : (
          <>
            <FormInput
              label="Contact Full Name"
              placeholder="Contact Full Name"
              value={contactFullName}
              onChange={(event) => setContactFullName(event.target.value)}
              invalid={!hasFullContactName}
            />
            <FormInput
              label="Company Name"
              placeholder="Company Name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              invalid={!companyName.trim()}
            />
          </>
        )}

        <Dropdown
          label="Country"
          options={countries.map((country) => ({
            key: String(country.id),
            label: country.name,
            value: String(country.id),
          }))}
          value={countryId}
          onChange={(value) => setCountryId(value)}
          placeholder={
            isLoadingCountries ? 'Loading countries...' : 'Select a country'
          }
        />

        <FormInput
          label={type === 'organization' ? 'Work Email' : 'Email'}
          placeholder={type === 'organization' ? 'Work Email' : 'Email'}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      {countryError ? (
        <p className="text-sm text-red-400">{countryError}</p>
      ) : null}
      {submitError ? (
        <p className="text-sm text-red-400">{submitError}</p>
      ) : null}
      {type === 'organization' && !hasFullContactName ? (
        <p className="text-sm text-red-400">
          Please enter the contact&apos;s first and last name.
        </p>
      ) : null}

      <CustomButton
        className="w-full px-6 py-3 text-base"
        onClick={handleSubmit}
        disabled={!isValid || Boolean(countryError) || isLoadingCountries}
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </CustomButton>
    </div>
  );
}

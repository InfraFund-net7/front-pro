'use client';

import { useState } from 'react';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import { Modal } from '@/components/ui/modal';
import { CustomButton } from '@/components/ui/custom-button';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#263247] last:border-0">
      <span className="text-sm text-[#8087A3]">{label}</span>
      <span className="text-sm font-medium text-white capitalize">{value}</span>
    </div>
  );
}

export default function AccountPage() {
  const { backendUser, openfortUser, deleteAccount } = useAuthSession();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const displayName = [backendUser?.first_name, backendUser?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const nameOrFallback =
    displayName || openfortUser?.name || openfortUser?.email || 'User';
  const avatarLabel = nameOrFallback.charAt(0).toUpperCase();
  const email =
    backendUser?.email ?? openfortUser?.email ?? openfortUser?.id ?? '—';

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount();
    } catch {
      setDeleteError('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Profile */}
      <div className="rounded-[24px] bg-[#343C5266] border border-[#263247] backdrop-blur-xl p-8">
        <h2 className="text-lg font-semibold text-white mb-6 chakra-petch">
          Profile
        </h2>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#263247] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {avatarLabel}
          </div>
          <div>
            <p className="text-white text-xl font-semibold">{nameOrFallback}</p>
            <p className="text-[#8087A3] text-sm mt-0.5">{email}</p>
            {backendUser && (
              <p className="text-[#8087A3] text-xs mt-1 capitalize">
                {backendUser.role} · {backendUser.type}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Account Details */}
      {backendUser && (
        <div className="rounded-[24px] bg-[#343C5266] border border-[#263247] backdrop-blur-xl p-8">
          <h2 className="text-lg font-semibold text-white mb-4 chakra-petch">
            Account Details
          </h2>
          <div>
            <DetailRow label="Account Type" value={backendUser.type} />
            <DetailRow label="Role" value={backendUser.role} />
            <DetailRow label="Status" value={backendUser.status} />
            <DetailRow
              label="KYC"
              value={backendUser.kyc_verified ? 'Verified' : 'Not verified'}
            />
            {backendUser.type === 'organization' &&
              backendUser.company_name && (
                <DetailRow
                  label="Organisation"
                  value={backendUser.company_name}
                />
              )}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-[24px] border border-[#3B1F24] bg-[#1A1113]/60 backdrop-blur-xl p-8">
        <h2 className="text-lg font-semibold text-white mb-2 chakra-petch">
          Danger Zone
        </h2>
        <p className="text-sm text-[#8087A3] mb-6">
          Permanently deletes your account, your embedded wallet, and all
          associated data from InfraFund and Openfort. This action cannot be
          undone.
        </p>
        <CustomButton
          variant="filled"
          className="bg-[#7F1D1D] border-[#7F1D1D] text-white hover:bg-[#991B1B] hover:border-[#991B1B] active:bg-[#7F1D1D]"
          onClick={() => setConfirmOpen(true)}
        >
          Delete My Account
        </CustomButton>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => !isDeleting && setConfirmOpen(false)}
        ModalTitle="Delete Account"
      >
        <p className="text-sm text-[#C7CAD5] mt-4">
          Are you sure? This will permanently remove your account, embedded
          wallet, and all data. You will not be able to recover it.
        </p>
        {deleteError && (
          <p className="text-sm text-red-400 mt-3">{deleteError}</p>
        )}
        <div className="flex gap-4 mt-8 w-full">
          <CustomButton
            variant="canceled"
            className="flex-1"
            onClick={() => setConfirmOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="filled"
            className="flex-1 bg-[#7F1D1D] border-[#7F1D1D] text-white hover:bg-[#991B1B] hover:border-[#991B1B]"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Confirm Delete'}
          </CustomButton>
        </div>
      </Modal>
    </div>
  );
}

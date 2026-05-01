'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const userNameAtom = atom<string>('Guest');

export const userRoleAtom = atomWithStorage<string>('infrafund_user_role', '');

export const formattedRoleAtom = atom((get) => {
    const role = get(userRoleAtom);
    return formatRoleLabel(role);
});

function formatRoleLabel(role: string): string {
    const normalized = role.trim().toLowerCase();
    if (!normalized) return 'Member';

    const roleMap: Record<string, string> = {
        investor: 'Investor',
        contractor: 'Contractor',
        client: 'Project Developer',
        dao: 'Governance Member',
    };

    return (
        roleMap[normalized] ??
        normalized
            .split(/[_\s-]+/)
            .filter(Boolean)
            .map((word) => word[0].toUpperCase() + word.slice(1))
            .join(' ')
    );
}
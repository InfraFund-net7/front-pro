'use client';

import { useAtom } from 'jotai';
import { useAccount, useParticleAuth } from '@particle-network/connectkit';
import { useEffect, useCallback } from 'react';
import {
    userNameAtom,
    userRoleAtom,
    formattedRoleAtom,
} from '@/atoms/userAtoms';

export function useUser() {
    const [userName, setUserName] = useAtom(userNameAtom);
    const [selectedRole, setSelectedRole] = useAtom(userRoleAtom);
    const formattedRole = useAtom(formattedRoleAtom)[0];

    const account = useAccount();
    const { getUserInfo } = useParticleAuth();

    const loadUserProfile = useCallback(async () => {
        if (account.status !== 'connected') {
            setUserName('Guest');
            return;
        }

        // Prefer Particle user profile
        try {
            const info = (await Promise.resolve(getUserInfo())) as unknown as Record<string, unknown> | undefined;

            const profileName =
                (typeof info?.name === 'string' && info.name.trim()) ||
                (typeof info?.nickname === 'string' && info.nickname.trim()) ||
                (typeof info?.email === 'string' && info.email.trim().split('@')[0]) ||
                '';

            if (profileName) {
                setUserName(profileName);
                return;
            }
        } catch (error) {
            console.warn('Failed to fetch Particle user info:', error);
        }

        // Fallback to shortened wallet address
        if (account.address) {
            const shortAddress = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
            setUserName(shortAddress);
        }
    }, [account.status, account.address, getUserInfo, setUserName]);

    // Load user profile when account changes
    useEffect(() => {
        loadUserProfile();
    }, [loadUserProfile]);

    return {
        userName,
        setUserName,
        selectedRole,
        setSelectedRole,
        formattedRole,
        isConnected: account.status === 'connected',
        address: account.address,
        refreshProfile: loadUserProfile,
    };
}
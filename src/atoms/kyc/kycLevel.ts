import { atom } from 'jotai';

export type KycLevel = 'none' | 'basic' | 'advanced';

export const kycLevelAtom = atom<KycLevel>('none');

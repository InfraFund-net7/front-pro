import { atom } from 'jotai'

export const kycStepAtom = atom(1)

export interface KYCData {
  fullName: string
  nationalId: string
  cardImage?: File
  selfieImage?: File
}

export const kycDataAtom = atom<KYCData>({
  fullName: '',
  nationalId: '',
})

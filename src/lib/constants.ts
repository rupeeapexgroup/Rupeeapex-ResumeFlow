import { PreferredJobRole, ApplicationStatus } from '@/types';

export const PREFERRED_JOB_ROLES: PreferredJobRole[] = [
  'GOLD',
  'NIDHI',
  'MFI',
  'CHIT',
  'INSURANCE',
  'OTHER',
];

export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'SELECTED', label: 'Selected', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
];

export const EDUCATION_QUALIFICATIONS = [
  '10th / SSLC',
  '12th / HSC',
  'ITI / Diploma',
  'B.Com',
  'B.Sc',
  'B.A',
  'BBA / BBM',
  'B.E / B.Tech',
  'BCA',
  'M.Com',
  'MBA',
  'MCA',
  'Post Graduate (Other)',
  'Other Graduate',
] as const;

export const BLOOD_Group = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Other'
] as const;

export const MARITAL_STATUSES = [
  'Single', 'Married', 'Divorced', 'Widowed'
] as const;

export const REFERRAL_SOURCES = [
  'Walk-in Direct',
  'Friend',
  'Reference',
  'Advertisement',
  'Other',
] as const;

export const BRAND = {
  name: 'Rupeeapex Group of Companies',
  portalName: 'ResumeFlow',
  tagline: 'HR Job Application Management Portal',
  primaryGreen: '#006B3C',
  primaryYellow: '#F5C400',
  logoPath: '/logo/rupeeapex-logo.jpeg',
  bannerPath: '/logo/rupeeapex-banner.jpeg',
  fullBannerPath: '/logo/Rupeeapex-fullBanner.jpeg',
};

export type MembershipTier = 'open' | 'standard' | 'sovereign' | 'academic_pro'

export const STUDENT_ACADEMIC_TIERS: MembershipTier[] = ['standard', 'sovereign']

export function hasStudentAcademicPortal(tier: MembershipTier | undefined): boolean {
  return tier === 'standard' || tier === 'sovereign'
}

export function tierDisplayName(tier: MembershipTier | undefined): string {
  if (tier === 'sovereign') return 'Sovereign'
  if (tier === 'standard') return 'Standard'
  if (tier === 'academic_pro') return 'Academic Pro'
  return 'Open'
}

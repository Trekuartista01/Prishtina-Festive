export const WINNER_SPACES = [
  'Sheshi Zahir Pajaziti',
  'Sheshi Xhorxh Bush',
] as const;

export const spaceMapping: Record<string, string> = {
  'Sheshi Zahir Pajaziti': 'Zahir Pajaziti',
  'Sheshi Xhorxh Bush': 'Xhorxh Bush',
  // Spaces from previous editions, kept so older records still display short names.
  'Sheshi Skënderbeu': 'Skenderbeu',
  'Wonderland (me mjete motorike)': 'Wonderland',
};

export function getDisplaySpace(space: string) {
  return spaceMapping[space] || space;
}

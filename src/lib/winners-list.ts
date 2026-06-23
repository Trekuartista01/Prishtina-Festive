export const WINNER_SPACES = [
  'Sheshi Skënderbeu',
  'Sheshi Zahir Pajaziti',
] as const;

export const spaceMapping: Record<string, string> = {
  'Sheshi Skënderbeu': 'Skenderbeu',
  'Sheshi Zahir Pajaziti': 'Zahir Pajaziti',
};

export function getDisplaySpace(space: string) {
  return spaceMapping[space] || space;
}

/**
 * Everything that changes between festival editions lives here.
 * Swap these values (and the assets in /public/assets/winter) for the next edition.
 */
export const EDITION = {
  /** Campaign line shown in the top banner. */
  campaign: "KREJT N'SHESH",
  /** Edition label next to the pattern, e.g. "FESTIVE EDITION". */
  editionLabel: 'EDITION',
  editionWord: 'FESTIVE',
  /** Date shown in the banner. TODO: set the real opening date (e.g. "12.12.26"). */
  date: '03.12.26',
  /** Name of the market used in the copy. */
  name: "Verë n'Dimën",
  year: 2026,
  /** Call-for-applications PDF (download button). */
  documentUrl: '/assets/winter/Thirrje-per-aplikim-2026.pdf',
  logo: '/assets/winter/logo-festive.png',
} as const;

export type EditionSpace = {
  /** Value saved on the applicant (keep stable — the dashboard and winners lists use it). */
  value: string;
  title: string;
  subtitle?: string;
  /** Photo of the square; a patterned placeholder is shown when missing. */
  image?: string;
};

export const EDITION_SPACES: EditionSpace[] = [
  {
    value: 'Sheshi Zahir Pajaziti',
    title: 'Sheshi "Zahir Pajaziti"',
    image: '/assets/winter/shesh-zahir.png',
  },
  {
    value: 'Sheshi Xhorxh Bush',
    title: 'Sheshi "Xhorxh Bush"',
    image: '/assets/winter/shesh-bush.png',
  },
];

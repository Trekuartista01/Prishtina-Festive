export function areApplicationsOpen(): boolean {
  return process.env.APPLICATIONS_OPEN !== 'false';
}

export const APPLICATIONS_CLOSED_MESSAGE =
  'Koha për aplikim ka përfunduar. Faleminderit për interesimin tuaj!';

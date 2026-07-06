import ContactForm from './Form';
import { areApplicationsOpen } from '@/lib/applications';

export const Formpage = () => {
  return (
    <div className="relative">
      <ContactForm applicationsOpen={areApplicationsOpen()} />
    </div>
  );
};

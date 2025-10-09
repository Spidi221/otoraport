import { Metadata } from 'next';
import { HelpCenterContent } from './help-center-content';

export const metadata: Metadata = {
  title: 'Centrum Pomocy | OTORAPORT',
  description:
    'Znajdź odpowiedzi na swoje pytania dotyczące OTORAPORT. FAQ, tutoriale wideo, dokumentacja API i wsparcie techniczne.',
  openGraph: {
    title: 'Centrum Pomocy | OTORAPORT',
    description:
      'Kompleksowa pomoc dla użytkowników OTORAPORT - FAQ, tutoriale, API docs i wsparcie',
    type: 'website',
  },
};

export default function HelpPage() {
  return <HelpCenterContent />;
}

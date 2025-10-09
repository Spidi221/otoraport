import { Metadata } from 'next';
import { HelpCenterContent } from './help-center-content';

export const metadata: Metadata = {
  title: 'Centrum Pomocy | OTO-RAPORT',
  description:
    'Znajdź odpowiedzi na swoje pytania dotyczące OTO-RAPORT. FAQ, tutoriale wideo, dokumentacja API i wsparcie techniczne.',
  openGraph: {
    title: 'Centrum Pomocy | OTO-RAPORT',
    description:
      'Kompleksowa pomoc dla użytkowników OTO-RAPORT - FAQ, tutoriale, API docs i wsparcie',
    type: 'website',
  },
};

export default function HelpPage() {
  return <HelpCenterContent />;
}

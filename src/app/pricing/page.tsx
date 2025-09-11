import { Metadata } from 'next'
import { PricingCard } from '@/components/dashboard/pricing-card'

export const metadata: Metadata = {
  title: 'Cennik - OTORAPORT',
  description: 'Wybierz plan, który najlepiej pasuje do Twoich potrzeb. Automatyczne raporty dla ministerstwa od 99 zł/mies.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Wybierz swój plan
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Automatyczne raporty cen mieszkań zgodnie z wymogami ministerstwa. 
            Rozpocznij już dziś z 7-dniowym okresem próbnym.
          </p>
        </div>
        
        <PricingCard />
        
        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Często zadawane pytania
          </h2>
          
          <div className="grid gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Czy mogę anulować subskrypcję w każdej chwili?</h3>
              <p className="text-slate-600">
                Tak, możesz anulować subskrypcję w każdej chwili bez żadnych dodatkowych opłat. 
                Twoja subskrypcja będzie aktywna do końca opłaconego okresu.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Jak długo trwa proces onboardingu?</h3>
              <p className="text-slate-600">
                Onboarding trwa średnio mniej niż 10 minut. Po opłaceniu subskrypcji natychmiast 
                otrzymasz dostęp do dashboardu i możesz przesłać swój pierwszy plik z cenami.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Czy dane są bezpieczne?</h3>
              <p className="text-slate-600">
                Wszystkie dane są szyfrowane i przechowywane zgodnie z RODO. Używamy Supabase 
                (PostgreSQL) z certyfikatami SOC 2 Type II i ISO 27001.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Co jeśli potrzebuję więcej funkcji?</h3>
              <p className="text-slate-600">
                Skontaktuj się z nami w sprawie dedykowanych rozwiązań Enterprise. 
                Oferujemy custom integracje, SLA, oraz dedykowany support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
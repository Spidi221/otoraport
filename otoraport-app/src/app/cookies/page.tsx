import { Metadata } from 'next'
import ScrollToTop from '@/components/ScrollToTop'

export const metadata: Metadata = {
  title: 'Polityka Cookies - OTORAPORT',
  description: 'Szczegółowa polityka cookies platformy OTORAPORT - informacje o plikach cookie używanych w serwisie. Zarządzaj preferencjami prywatności.',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://otoraport.pl/cookies',
  },
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Polityka Cookies
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-800 font-medium mb-2">🍪 Pliki Cookie</p>
              <p className="text-blue-700 text-sm">
                Szczegółowe informacje o plikach cookie używanych w platformie OTORAPORT 
                oraz sposobach zarządzania preferencjami.
                Ostatnia aktualizacja: 11 września 2025.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Czym Są Cookies</h2>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 mb-2">
                  <strong>Cookies (pliki cookie)</strong> to małe pliki tekstowe zapisywane na Twoim urządzeniu 
                  podczas przeglądania stron internetowych.
                </p>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Umożliwiają zapamiętanie Twoich preferencji</li>
                  <li>• Poprawiają funkcjonalność serwisu</li>
                  <li>• Zapewniają bezpieczeństwo logowania</li>
                  <li>• Pomagają w analizie ruchu na stronie</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Rodzaje Cookies</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">🔐 Niezbędne</h3>
                  <p className="text-green-700 text-sm mb-2">
                    Wymagane do podstawowego funkcjonowania
                  </p>
                  <ul className="text-green-600 text-xs space-y-1">
                    <li>• Sesje logowania</li>
                    <li>• Zabezpieczenia CSRF</li>
                    <li>• Ustawienia językowe</li>
                    <li>• Koszyk zakupów</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">⚙️ Funkcjonalne</h3>
                  <p className="text-blue-700 text-sm mb-2">
                    Zapamiętują Twoje preferencje
                  </p>
                  <ul className="text-blue-600 text-xs space-y-1">
                    <li>• Tryb ciemny/jasny</li>
                    <li>• Rozmiar czcionki</li>
                    <li>• Layout dashboardu</li>
                    <li>• Filtry tabeli</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-2">📊 Analityczne</h3>
                  <p className="text-purple-700 text-sm mb-2">
                    Pomagają zrozumieć korzystanie z serwisu
                  </p>
                  <ul className="text-purple-600 text-xs space-y-1">
                    <li>• Google Analytics</li>
                    <li>• Statystyki wizyt</li>
                    <li>• Heat mapy</li>
                    <li>• Performance monitoring</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-2">📢 Marketingowe</h3>
                  <p className="text-orange-700 text-sm mb-2">
                    Personalizują reklamy i komunikację
                  </p>
                  <ul className="text-orange-600 text-xs space-y-1">
                    <li>• Facebook Pixel</li>
                    <li>• Google Ads</li>
                    <li>• LinkedIn Insight</li>
                    <li>• Email tracking</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Szczegółowa Lista Cookies</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">🔐 Cookies Niezbędne</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="border border-gray-200 px-3 py-2 text-left">Nazwa</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Cel</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Żywotność</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">next-auth.session-token</td>
                        <td className="border border-gray-200 px-3 py-2">Sesja logowania użytkownika</td>
                        <td className="border border-gray-200 px-3 py-2">30 dni</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">next-auth.csrf-token</td>
                        <td className="border border-gray-200 px-3 py-2">Zabezpieczenie CSRF</td>
                        <td className="border border-gray-200 px-3 py-2">Sesja</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">cenysync-preferences</td>
                        <td className="border border-gray-200 px-3 py-2">Ustawienia interfejsu</td>
                        <td className="border border-gray-200 px-3 py-2">1 rok</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">cenysync-consent</td>
                        <td className="border border-gray-200 px-3 py-2">Zgoda na cookies</td>
                        <td className="border border-gray-200 px-3 py-2">1 rok</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">📊 Cookies Analityczne</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="border border-gray-200 px-3 py-2 text-left">Nazwa</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Dostawca</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Cel</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Żywotność</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">_ga</td>
                        <td className="border border-gray-200 px-3 py-2">Google</td>
                        <td className="border border-gray-200 px-3 py-2">Identyfikacja użytkownika</td>
                        <td className="border border-gray-200 px-3 py-2">2 lata</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">_ga_*</td>
                        <td className="border border-gray-200 px-3 py-2">Google</td>
                        <td className="border border-gray-200 px-3 py-2">Sesje GA4</td>
                        <td className="border border-gray-200 px-3 py-2">2 lata</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">_gid</td>
                        <td className="border border-gray-200 px-3 py-2">Google</td>
                        <td className="border border-gray-200 px-3 py-2">Sesja użytkownika</td>
                        <td className="border border-gray-200 px-3 py-2">24 godziny</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">📢 Cookies Marketingowe</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="border border-gray-200 px-3 py-2 text-left">Nazwa</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Dostawca</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Cel</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Żywotność</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">_fbp</td>
                        <td className="border border-gray-200 px-3 py-2">Facebook</td>
                        <td className="border border-gray-200 px-3 py-2">Pixel tracking</td>
                        <td className="border border-gray-200 px-3 py-2">3 miesiące</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">_gcl_au</td>
                        <td className="border border-gray-200 px-3 py-2">Google</td>
                        <td className="border border-gray-200 px-3 py-2">Google Ads conversion</td>
                        <td className="border border-gray-200 px-3 py-2">3 miesiące</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">li_sugr</td>
                        <td className="border border-gray-200 px-3 py-2">LinkedIn</td>
                        <td className="border border-gray-200 px-3 py-2">Browser ID</td>
                        <td className="border border-gray-200 px-3 py-2">3 miesiące</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Zarządzanie Cookies</h2>
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-semibold text-indigo-800 mb-2">⚙️ Ustawienia w OTORAPORT</h3>
                  <p className="text-indigo-700 text-sm mb-3">
                    Możesz zarządzać preferencjami cookies bezpośrednio w naszej platformie:
                  </p>
                  <ul className="text-indigo-600 text-sm space-y-1">
                    <li>• <strong>Banner zgody</strong> - przy pierwszej wizycie</li>
                    <li>• <strong>Centrum preferencji</strong> - w stopce strony</li>
                    <li>• <strong>Ustawienia konta</strong> - sekcja "Prywatność"</li>
                    <li>• <strong>Kontakt z DPO</strong> - dpo@cenysync.pl</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">🌐 Ustawienia Przeglądarki</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-blue-700 text-sm font-medium mb-1">Chrome</p>
                      <p className="text-blue-600 text-xs">Ustawienia → Prywatność → Cookies</p>
                    </div>
                    <div>
                      <p className="text-blue-700 text-sm font-medium mb-1">Firefox</p>
                      <p className="text-blue-600 text-xs">Opcje → Prywatność i bezpieczeństwo</p>
                    </div>
                    <div>
                      <p className="text-blue-700 text-sm font-medium mb-1">Safari</p>
                      <p className="text-blue-600 text-xs">Preferencje → Prywatność</p>
                    </div>
                    <div>
                      <p className="text-blue-700 text-sm font-medium mb-1">Edge</p>
                      <p className="text-blue-600 text-xs">Ustawienia → Prywatność</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Cookies Stron Trzecich</h2>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2">🔗 Dostawcy Zewnętrzni</h3>
                  <p className="text-red-700 text-sm mb-3">
                    Niektóre cookies są ustawiane przez usługi stron trzecich:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-red-700 font-medium mb-1">Google Services</p>
                      <ul className="text-red-600 text-xs space-y-1">
                        <li>• Google Analytics</li>
                        <li>• Google Ads</li>
                        <li>• reCAPTCHA</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-red-700 font-medium mb-1">Social Media</p>
                      <ul className="text-red-600 text-xs space-y-1">
                        <li>• Facebook Pixel</li>
                        <li>• LinkedIn Insight</li>
                        <li>• Twitter Analytics</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-red-100 rounded">
                    <p className="text-red-800 text-sm">
                      <strong>Kontrola:</strong> Możesz zarządzać tymi cookies poprzez 
                      nasze centrum preferencji lub bezpośrednio u dostawców.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Wpływ na Funkcjonalność</h2>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-3">⚠️ Ograniczenia przy Wyłączeniu</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-red-600 text-lg">🔐</span>
                    <div>
                      <p className="text-yellow-800 font-medium">Cookies Niezbędne</p>
                      <p className="text-yellow-700 text-sm">Wyłączenie uniemożliwi korzystanie z platformy</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 text-lg">⚙️</span>
                    <div>
                      <p className="text-yellow-800 font-medium">Cookies Funkcjonalne</p>
                      <p className="text-yellow-700 text-sm">Utrata personalizacji i ustawień</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 text-lg">📊</span>
                    <div>
                      <p className="text-yellow-800 font-medium">Cookies Analityczne</p>
                      <p className="text-yellow-700 text-sm">Brak wpływu na funkcjonalność</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-orange-600 text-lg">📢</span>
                    <div>
                      <p className="text-yellow-800 font-medium">Cookies Marketingowe</p>
                      <p className="text-yellow-700 text-sm">Mniej spersonalizowane treści</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Aktualizacje Polityki</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 text-sm mb-2">
                  <strong>Powiadamianie o zmianach:</strong> W przypadku istotnych zmian w polityce cookies, 
                  poinformujemy Cię przez:
                </p>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Email na adres przypisany do konta</li>
                  <li>• Banner informacyjny w platformie</li>
                  <li>• Aktualizacja na tej stronie</li>
                  <li>• Możliwość ponownej zgody</li>
                </ul>
              </div>
            </section>

            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg text-center">
              <h3 className="text-xl font-semibold mb-2">Potrzebujesz pomocy z cookies?</h3>
              <p className="mb-4">Skontaktuj się z naszym zespołem wsparcia</p>
              <div className="space-x-4">
                <a 
                  href="mailto:support@cenysync.pl" 
                  className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-block"
                >
                  📧 support@cenysync.pl
                </a>
                <a 
                  href="#cookie-preferences" 
                  className="bg-purple-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-900 transition-colors inline-block"
                >
                  ⚙️ Zarządzaj cookies
                </a>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-500 text-sm">
                Polityka cookies zaktualizowana: 11 września 2025 | 
                <a href="/privacy" className="text-blue-600 hover:underline ml-1">Prywatność</a> | 
                <a href="/terms" className="text-blue-600 hover:underline ml-1">Regulamin</a> | 
                <a href="/rodo" className="text-blue-600 hover:underline ml-1">RODO</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  )
}
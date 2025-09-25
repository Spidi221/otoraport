import { Metadata } from 'next'
import ScrollToTop from '@/components/ScrollToTop'

export const metadata: Metadata = {
  title: 'Regulamin Serwisu - OTORAPORT',
  description: 'Regulamin platformy OTORAPORT - warunki korzystania z usług SaaS dla deweloperów nieruchomości. Pełne warunki świadczenia usług automatyzacji compliance.',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://otoraport.pl/terms',
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Regulamin Serwisu
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-800 font-medium mb-2">📋 Regulamin B2B</p>
              <p className="text-blue-700 text-sm">
                Warunki świadczenia usług platformy OTORAPORT dla przedsiębiorców z branży deweloperskiej.
                Wersja obowiązująca od: 11 września 2025.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Postanowienia Ogólne</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2"><strong>Usługodawca:</strong> OTORAPORT Sp. z o.o.</p>
                <p className="mb-2"><strong>Adres:</strong> ul. Technologiczna 15, 00-001 Warszawa</p>
                <p className="mb-2"><strong>NIP:</strong> 1234567890</p>
                <p className="mb-2"><strong>KRS:</strong> 0000123456</p>
                <p className="mb-2"><strong>Email:</strong> kontakt@cenysync.pl</p>
                <p><strong>Telefon:</strong> +48 22 123 45 67</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Definicje</h2>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p><strong>Platforma OTORAPORT</strong> - system SaaS do automatycznego compliance z ministerstwem</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p><strong>Klient</strong> - przedsiębiorca z branży deweloperskiej korzystający z Platformy</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p><strong>Compliance</strong> - zgodność z ustawą z 21 maja 2025 o cenach mieszkań</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Pakiety Subskrypcyjne</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-bold text-green-800 mb-2">BASIC - 149 zł/mies</h3>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>✅ Do 2 projektów</li>
                    <li>✅ Compliance XML/MD</li>
                    <li>✅ Wsparcie email</li>
                    <li>✅ Podstawowy dashboard</li>
                  </ul>
                  <p className="text-green-600 text-xs mt-2">Idealne dla małych deweloperów</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2">PRO - 249 zł/mies</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>✅ Do 10 projektów</li>
                    <li>✅ Strony prezentacyjne</li>
                    <li>✅ Priorytetowe wsparcie</li>
                    <li>✅ Zaawansowana analityka</li>
                  </ul>
                  <p className="text-blue-600 text-xs mt-2">Najpopularniejszy wybór</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-bold text-purple-800 mb-2">ENTERPRISE - 399 zł/mies</h3>
                  <ul className="text-purple-700 text-sm space-y-1">
                    <li>✅ Nieograniczone projekty</li>
                    <li>✅ Custom domeny</li>
                    <li>✅ API access</li>
                    <li>✅ White-label</li>
                  </ul>
                  <p className="text-purple-600 text-xs mt-2">Dla dużych grup deweloperskich</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Proces Rejestracji</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">📝 Wymagane Dane</h3>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Nazwa firmy i NIP</li>
                  <li>• Email i telefon kontaktowy</li>
                  <li>• Adres siedziby</li>
                  <li>• Dane osoby odpowiedzialnej</li>
                  <li>• Wybór pakietu subskrypcyjnego</li>
                </ul>
                <div className="mt-3 p-3 bg-yellow-100 rounded">
                  <p className="text-yellow-800 text-sm font-medium">🎯 Trial 14-dniowy</p>
                  <p className="text-yellow-700 text-sm">
                    Każdy nowy klient otrzymuje 14-dniowy dostęp próbny z pełną funkcjonalnością pakietu PRO.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Zobowiązania Klienta</h2>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">🚫 Zabronione Działania</h3>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Próby włamania do systemu</li>
                    <li>• Udostępnianie loginu osobom trzecim</li>
                    <li>• Upload danych naruszających prawo</li>
                    <li>• Reverse engineering aplikacji</li>
                    <li>• Przekraczanie limitów API</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Wymagane Działania</h3>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Podawanie prawdziwych danych</li>
                    <li>• Terminowe opłaty subskrypcyjne</li>
                    <li>• Przestrzeganie limitów pakietu</li>
                    <li>• Informowanie o zmianach w firmie</li>
                    <li>• Backup własnych danych</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Płatności i Rozliczenia</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">💳 Metody Płatności</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Przelewy24 (karty, BLIK, przelewy)</li>
                    <li>• Przelew tradycyjny (faktury)</li>
                    <li>• Płatność cykliczna (autoryzacja)</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">📅 Cykle Rozliczeniowe</h3>
                  <ul className="text-orange-700 text-sm space-y-1">
                    <li>• <strong>Miesięczny:</strong> płatność z góry, bez rabatu</li>
                    <li>• <strong>Roczny:</strong> płatność z góry, 15% rabatu</li>
                    <li>• <strong>Trial:</strong> bezpłatny przez pierwsze 14 dni</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. SLA i Dostępność</h2>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-800 mb-3">📊 Gwarantowana Dostępność</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-700">Basic</span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium">99.0%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-700">Pro</span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium">99.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-700">Enterprise</span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium">99.9%</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-indigo-100 rounded">
                  <p className="text-indigo-800 text-sm">
                    <strong>Rekompensata:</strong> W przypadku przekroczenia SLA, Klient otrzymuje proporcjonalny zwrot za okresy niedostępności.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Wypowiedzenie Umowy</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">👤 Przez Klienta</h3>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• W każdym czasie z 30-dniowym wyprzedzeniem</li>
                    <li>• Przez panel konta lub email</li>
                    <li>• Bez kar umownych</li>
                    <li>• Zwrot niewykorzystanej części opłaty</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2">🏢 Przez OTORAPORT</h3>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Za naruszenie regulaminu</li>
                    <li>• Za brak płatności (7 dni zwłoki)</li>
                    <li>• Za działania niezgodne z prawem</li>
                    <li>• Z 14-dniowym wyprzedzeniem</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Odpowiedzialność</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">⚖️ Ograniczenia Odpowiedzialności</h3>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li>• <strong>Maksymalna odpowiedzialność:</strong> równa 3-miesięcznej opłacie subskrypcyjnej</li>
                  <li>• <strong>Wyłączenia:</strong> szkody pośrednie, utracone korzyści, dane osoby trzecich</li>
                  <li>• <strong>Backup danych:</strong> Klient zobowiązany do własnych kopii zapasowych</li>
                  <li>• <strong>Force majeure:</strong> wyłączenie w przypadku siły wyższej</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Wsparcie Techniczne</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <h4 className="font-semibold text-green-800">Basic</h4>
                    <p className="text-green-700 text-sm">Email</p>
                    <p className="text-green-600 text-xs">48h</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <h4 className="font-semibold text-blue-800">Pro</h4>
                    <p className="text-blue-700 text-sm">Email + Tel</p>
                    <p className="text-blue-600 text-xs">24h</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <h4 className="font-semibold text-purple-800">Enterprise</h4>
                    <p className="text-purple-700 text-sm">24/7 Premium</p>
                    <p className="text-purple-600 text-xs">4h</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Postanowienia Końcowe</h2>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <ul className="text-indigo-700 text-sm space-y-2">
                  <li>• <strong>Prawo właściwe:</strong> prawo polskie</li>
                  <li>• <strong>Sąd właściwy:</strong> sąd dla siedziby OTORAPORT Sp. z o.o.</li>
                  <li>• <strong>Zmiany regulaminu:</strong> z 14-dniowym wyprzedzeniem</li>
                  <li>• <strong>Mediacje:</strong> preferowane pozasądowe rozstrzyganie sporów</li>
                  <li>• <strong>Severability:</strong> nieważność części nie wpływa na całość</li>
                </ul>
              </div>
            </section>

            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg text-center">
              <h3 className="text-xl font-semibold mb-2">Masz pytania o regulamin?</h3>
              <p className="mb-4">Skontaktuj się z naszym zespołem prawnym</p>
              <a 
                href="mailto:legal@cenysync.pl" 
                className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                📧 legal@cenysync.pl
              </a>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-500 text-sm">
                Regulamin obowiązujący od: 11 września 2025 | 
                <a href="/privacy" className="text-blue-600 hover:underline ml-1">Prywatność</a> | 
                <a href="/cookies" className="text-blue-600 hover:underline ml-1">Cookies</a> | 
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
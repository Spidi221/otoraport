import { LegalLayout } from '@/components/legal-layout'

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Polityka Prywatności"
      lastUpdated="3 października 2025"
    >
      <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Data wejścia w życie:</strong> 3 października 2025 r.<br />
          <strong>Ostatnia aktualizacja:</strong> 3 października 2025 r.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">I. ADMINISTRATOR DANYCH OSOBOWYCH</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Dane Administratora</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-700 mb-2">
              <strong>Administratorem danych osobowych</strong> w rozumieniu Rozporządzenia Parlamentu Europejskiego
              i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO) jest:
            </p>
            <ul className="list-none space-y-1 text-gray-700 ml-4">
              <li><strong>[NAZWA FIRMY]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>Forma prawna: <strong>[sp. z o.o. / S.A. / inne]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>Siedziba: <strong>[ADRES SIEDZIBY]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>NIP: <strong>[NIP]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>REGON: <strong>[REGON]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>KRS/CEiDG: <strong>[NUMER KRS lub CEiDG]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
              <li>Email kontaktowy: <strong>kontakt@otoraport.pl</strong></li>
              <li>Telefon: <strong>[NUMER TELEFONU]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
            </ul>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Inspektor Ochrony Danych (opcjonalnie)</h3>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800 mb-2">
              <strong>⚠️ DO USTALENIA:</strong> Czy wymagane jest powołanie Inspektora Ochrony Danych (IOD/DPO)?
            </p>
            <p className="text-sm text-gray-700 mb-2">
              Zgodnie z art. 37 RODO, IOD jest obowiązkowy gdy:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 ml-4 space-y-1">
              <li>Przetwarzanie prowadzi organ lub podmiot publiczny,</li>
              <li>Podstawowa działalność polega na regularnym i systematycznym monitoringu osób na dużą skalę,</li>
              <li>Podstawowa działalność polega na przetwarzaniu danych szczególnych kategorii (art. 9 RODO) na dużą skalę.</li>
            </ul>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Dla OTORAPORT (B2B SaaS):</strong> Prawdopodobnie NIE jest wymagany, ale należy skonsultować z prawnikiem.
            </p>
          </div>
          <p className="text-gray-700 mt-2">
            <em>Jeśli IOD został powołany, dane kontaktowe zostaną uzupełnione poniżej:</em>
          </p>
          <ul className="list-none space-y-1 text-gray-700 ml-4 mt-2">
            <li>Email IOD: <strong>[EMAIL_IOD]</strong> <span className="text-red-600">[jeśli dotyczy]</span></li>
            <li>Adres korespondencyjny: <strong>[ADRES_IOD]</strong> <span className="text-red-600">[jeśli dotyczy]</span></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Kontakt w sprawie danych osobowych</h3>
          <p className="text-gray-700 mb-2">
            W sprawach związanych z przetwarzaniem danych osobowych, w tym w celu realizacji praw przysługujących
            na mocy RODO, można kontaktować się:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
            <li>Email: <strong>kontakt@otoraport.pl</strong> (temat: "RODO - pytanie o dane osobowe")</li>
            <li>Pisemnie: na adres siedziby Administratora</li>
            <li>Telefonicznie: <strong>[NUMER TELEFONU]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">II. PODSTAWY PRAWNE I CELE PRZETWARZANIA</h2>

        <p className="text-gray-700 mb-4">
          Przetwarzanie danych osobowych odbywa się zgodnie z RODO oraz ustawą z dnia 10 maja 2018 r. o ochronie
          danych osobowych (Dz.U. 2018 poz. 1000 z późn. zm.).
        </p>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Tabela: Cele, podstawy prawne i okres przechowywania danych</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Cel przetwarzania</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Podstawa prawna (RODO)</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Kategorie danych</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Okres przechowywania</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>1. Rejestracja i zarządzanie Kontem</strong><br/>
                    Utworzenie Konta Użytkownika, uwierzytelnianie, zarządzanie profilem
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>Art. 6 ust. 1 lit. b RODO</strong><br/>
                    (wykonanie umowy świadczenia usług drogą elektroniczną)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Email, hasło (hash), nazwa firmy, NIP, adres, telefon
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Do momentu usunięcia Konta + 30 dni (retencja backup)
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>2. Świadczenie Usług</strong><br/>
                    Przetwarzanie plików, generowanie raportów XML/CSV, udostępnianie endpointów ministerstwa
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>Art. 6 ust. 1 lit. b RODO</strong><br/>
                    (wykonanie umowy)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Dane z przesłanych plików CSV/Excel (dane deweloperów, dane nieruchomości)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Przez czas trwania umowy + 30 dni po anulowaniu Subskrypcji
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>3. Płatności i rozliczenia</strong><br/>
                    Obsługa subskrypcji, przetwarzanie płatności, wystawianie faktur VAT
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>Art. 6 ust. 1 lit. b RODO</strong><br/>
                    (wykonanie umowy)<br/><br/>
                    <strong>Art. 6 ust. 1 lit. c RODO</strong><br/>
                    (obowiązek prawny - księgowość, podatki)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    NIP, nazwa firmy, adres, dane płatności (via Stripe), historia transakcji
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>5 lat od końca roku, w którym powstał obowiązek podatkowy</strong><br/>
                    (zgodnie z Ordynacją podatkową)
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>4. Komunikacja i wsparcie</strong><br/>
                    Odpowiedzi na pytania, wsparcie techniczne, powiadomienia email
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>Art. 6 ust. 1 lit. b RODO</strong><br/>
                    (wykonanie umowy)<br/><br/>
                    <strong>Art. 6 ust. 1 lit. f RODO</strong><br/>
                    (prawnie uzasadniony interes - obsługa klienta)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Email, imię, nazwisko (jeśli podane), treść korespondencji
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Do momentu zakończenia sprawy + 1 rok (na wypadek reklamacji)
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>5. Bezpieczeństwo i przeciwdziałanie nadużyciom</strong><br/>
                    Rate limiting, wykrywanie ataków, logi dostępu, monitoring bezpieczeństwa
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>Art. 6 ust. 1 lit. f RODO</strong><br/>
                    (prawnie uzasadniony interes - zabezpieczenie systemów)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Adres IP, User-Agent, timestampy żądań, logi błędów
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>90 dni od zebrania</strong><br/>
                    (w przypadku wykrycia incydentu: do zakończenia postępowania)
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>6. Analiza statystyczna i optymalizacja</strong><br/>
                    Vercel Analytics, analiza ruchu, ulepszanie funkcjonalności
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>Art. 6 ust. 1 lit. f RODO</strong><br/>
                    (prawnie uzasadniony interes - rozwój Serwisu)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Dane zanonimizowane: statystyki odwiedzin, czas ładowania stron, błędy
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>24 miesiące</strong><br/>
                    (dane zagregowane, zanonimizowane)
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>7. Marketing (newsletter, oferty)</strong><br/>
                    <em>Tylko po wyrażeniu zgody</em>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>Art. 6 ust. 1 lit. a RODO</strong><br/>
                    (zgoda - można cofnąć w każdej chwili)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Email, nazwa firmy (jeśli podana)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Do momentu cofnięcia zgody
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>8. Dochodzenie roszczeń</strong><br/>
                    Obrona przed roszczeniami, dochodzenie należności
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>Art. 6 ust. 1 lit. f RODO</strong><br/>
                    (prawnie uzasadniony interes - ochrona prawna)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Wszystkie dane związane z umową
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>Do czasu przedawnienia roszczeń</strong><br/>
                    (zazwyczaj 6 lat od końca roku, w którym roszczenie stało się wymagalne)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <h4 className="font-semibold text-blue-900 mb-2">Ważne informacje o podstawach prawnych:</h4>
          <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
            <li><strong>Art. 6 ust. 1 lit. b RODO</strong> - nie wymaga zgody, przetwarzanie jest niezbędne do wykonania umowy</li>
            <li><strong>Art. 6 ust. 1 lit. c RODO</strong> - obowiązek prawny (np. przepisy podatkowe, księgowe)</li>
            <li><strong>Art. 6 ust. 1 lit. f RODO</strong> - prawnie uzasadniony interes (można wnieść sprzeciw)</li>
            <li><strong>Art. 6 ust. 1 lit. a RODO</strong> - zgoda (można cofnąć w każdej chwili bez wpływu na dotychczasowe przetwarzanie)</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">III. KATEGORIE PRZETWARZANYCH DANYCH</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Dane zbierane bezpośrednio od Użytkownika</h3>
          <p className="text-gray-700 mb-2">Podczas rejestracji i korzystania z Serwisu zbieramy:</p>

          <div className="ml-4 space-y-3">
            <div>
              <strong className="text-gray-900">a) Dane identyfikacyjne i kontaktowe:</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Adres email (wymagany - login)</li>
                <li>Imię i nazwisko (opcjonalne, jeśli osoba kontaktowa)</li>
                <li>Numer telefonu (opcjonalny)</li>
              </ul>
            </div>

            <div>
              <strong className="text-gray-900">b) Dane podmiotu gospodarczego:</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Nazwa firmy / działalności gospodarczej</li>
                <li>NIP (Numer Identyfikacji Podatkowej)</li>
                <li>REGON (opcjonalny)</li>
                <li>KRS lub CEiDG (opcjonalny)</li>
                <li>Adres siedziby (ulica, kod pocztowy, miasto)</li>
              </ul>
            </div>

            <div>
              <strong className="text-gray-900">c) Dane uwierzytelniające:</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Hasło (przechowywane jako hash bcrypt - nie mamy dostępu do plaintextu)</li>
                <li>Token sesji (via Supabase Auth)</li>
              </ul>
            </div>

            <div>
              <strong className="text-gray-900">d) Dane z przesłanych plików (Treści):</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Dane deweloperów nieruchomości (nazwa, NIP, adres, kontakt)</li>
                <li>Dane nieruchomości (lokalizacja, powierzchnia, ceny)</li>
                <li><strong>UWAGA:</strong> Pliki nie powinny zawierać danych szczególnych kategorii (art. 9 RODO).
                  Użytkownik zobowiązany jest do anonimizacji danych wrażliwych przed przesłaniem.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Dane zbierane automatycznie</h3>
          <p className="text-gray-700 mb-2">Podczas korzystania z Serwisu automatycznie zbieramy:</p>

          <div className="ml-4 space-y-3">
            <div>
              <strong className="text-gray-900">a) Dane techniczne:</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Adres IP (do celów bezpieczeństwa i rate limiting)</li>
                <li>User-Agent (przeglądarka, system operacyjny)</li>
                <li>Dane o urządzeniu (rozdzielczość ekranu, typ urządzenia)</li>
                <li>Timestampy żądań HTTP</li>
              </ul>
            </div>

            <div>
              <strong className="text-gray-900">b) Dane o korzystaniu z Serwisu:</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Logi aktywności (czas logowania, akcje w panelu)</li>
                <li>Historia przesłanych plików (nazwa pliku, rozmiar, data)</li>
                <li>Historia transakcji (data, kwota, status płatności)</li>
                <li>Błędy i problemy techniczne (do debugowania)</li>
              </ul>
            </div>

            <div>
              <strong className="text-gray-900">c) Pliki cookies i technologie śledzące:</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Cookies techniczne (niezbędne do działania Serwisu)</li>
                <li>Cookies sesji (uwierzytelnianie)</li>
                <li>Vercel Analytics (zanonimizowane statystyki ruchu)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-1">
                Szczegółowe informacje w sekcji VII. "Pliki cookies i technologie śledzące".
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Dane otrzymywane od podmiotów trzecich</h3>
          <p className="text-gray-700 mb-2">W przypadku rejestracji przez Google OAuth:</p>
          <ul className="list-disc list-inside text-gray-700 ml-4">
            <li>Email (z konta Google)</li>
            <li>Imię i nazwisko (jeśli udostępnione w profilu Google)</li>
            <li>Zdjęcie profilowe (opcjonalne)</li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            Przetwarzanie odbywa się zgodnie z polityką prywatności Google.
            Link: <a href="https://policies.google.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            https://policies.google.com/privacy</a>
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">IV. ODBIORCY DANYCH (PODMIOTY PRZETWARZAJĄCE)</h2>

        <p className="text-gray-700 mb-4">
          W celu świadczenia Usług korzystamy z usług podmiotów zewnętrznych (podmioty przetwarzające w rozumieniu
          art. 28 RODO). Wszystkie podmioty działają na podstawie umów powierzenia przetwarzania danych i zobowiązane
          są do zachowania poufności oraz przestrzegania wymogów RODO.
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Kategoria odbiorcy</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Nazwa podmiotu</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Cel przetwarzania</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Lokalizacja</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>Hosting i infrastruktura</strong>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>Vercel Inc.</strong><br/>
                  340 S Lemon Ave #4133<br/>
                  Walnut, CA 91789, USA
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  Hosting aplikacji, CDN, Vercel Analytics (zanonimizowane statystyki)
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  USA (Amazon AWS)<br/>
                  <span className="text-amber-600">⚠️ Przekazanie poza EOG</span>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>Baza danych i autentykacja</strong>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>Supabase Inc.</strong><br/>
                  970 Toa Payoh North #07-04<br/>
                  Singapore 318992
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  PostgreSQL database, Supabase Auth (uwierzytelnianie), backup danych
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>UE (domyślnie Frankfurt, Niemcy)</strong><br/>
                  lub <span className="text-amber-600">⚠️ USA</span> (zależy od konfiguracji projektu)
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>Płatności</strong>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>Stripe Payments Europe, Ltd.</strong><br/>
                  The One Building<br/>
                  1 Grand Canal Street Lower<br/>
                  Dublin 2, Irlandia
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  Przetwarzanie płatności kartą, BLIK, SEPA. Przechowywanie tokenów kart płatniczych (PCI DSS Level 1)
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>UE (Irlandia)</strong><br/>
                  + <span className="text-amber-600">⚠️ USA</span> (infrastruktura backup Stripe)
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>Email transakcyjny</strong>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>Resend, Inc.</strong><br/>
                  2093 Philadelphia Pike #8489<br/>
                  Claymont, DE 19703, USA
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  Wysyłka emaili transakcyjnych (potwierdzenia rejestracji, powiadomienia o płatnościach, wsparcie)
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  USA (Amazon SES)<br/>
                  <span className="text-amber-600">⚠️ Przekazanie poza EOG</span>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>Autentykacja OAuth</strong>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>Google LLC</strong><br/>
                  1600 Amphitheatre Parkway<br/>
                  Mountain View, CA 94043, USA
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  Google OAuth (opcjonalna metoda logowania)
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  USA<br/>
                  <span className="text-amber-600">⚠️ Przekazanie poza EOG</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <h4 className="font-semibold text-blue-900 mb-2">Umowy powierzenia przetwarzania danych (DPA):</h4>
          <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
            <li><strong>Vercel:</strong> Data Processing Agreement (DPA) zgodny z RODO -
              <a href="https://vercel.com/legal/dpa" className="underline ml-1" target="_blank" rel="noopener noreferrer">
                https://vercel.com/legal/dpa
              </a>
            </li>
            <li><strong>Supabase:</strong> Data Processing Addendum (DPA) -
              <a href="https://supabase.com/legal/dpa" className="underline ml-1" target="_blank" rel="noopener noreferrer">
                https://supabase.com/legal/dpa
              </a>
            </li>
            <li><strong>Stripe:</strong> Data Processing Agreement -
              <a href="https://stripe.com/legal/dpa" className="underline ml-1" target="_blank" rel="noopener noreferrer">
                https://stripe.com/legal/dpa
              </a>
            </li>
            <li><strong>Resend:</strong> DPA zgodny z RODO (dostępny na żądanie)</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Organy publiczne</h3>
          <p className="text-gray-700 mb-2">
            Dane osobowe mogą być udostępniane organom państwowym wyłącznie w przypadkach wymaganych przez przepisy
            prawa, w tym:
          </p>
          <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
            <li>Urząd Skarbowy (dane do celów podatkowych - faktury VAT),</li>
            <li>Prezes Urzędu Ochrony Danych Osobowych (PUODO) - w przypadku kontroli,</li>
            <li>Sądy i organy ścigania - na podstawie odpowiednich postanowień sądowych,</li>
            <li>Ministerstwo Rozwoju i Technologii - dane przekazywane przez Użytkowników (endpointy dane.gov.pl).</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">V. PRZEKAZYWANIE DANYCH POZA EUROPEJSKI OBSZAR GOSPODARCZY (EOG)</h2>

        <p className="text-gray-700 mb-4">
          Niektórzy nasi dostawcy usług przetwarzają dane poza Europejskim Obszarem Gospodarczym (EOG), w szczególności
          w Stanach Zjednoczonych. Zapewniamy odpowiedni poziom ochrony danych poprzez stosowanie mechanizmów
          określonych w RODO.
        </p>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Mechanizmy ochrony przy przekazywaniu poza EOG</h3>

          <div className="ml-4 space-y-3">
            <div>
              <strong className="text-gray-900">a) Standardowe klauzule umowne (SCC):</strong>
              <p className="text-gray-700 mt-1">
                Wszystkie podmioty przetwarzające dane poza EOG (Vercel, Stripe, Resend, Google) stosują
                <strong> Standard Contractual Clauses (SCC)</strong> zatwierdzone przez Komisję Europejską
                (Decyzja 2021/914 z dnia 4 czerwca 2021 r.).
              </p>
            </div>

            <div>
              <strong className="text-gray-900">b) EU-U.S. Data Privacy Framework:</strong>
              <p className="text-gray-700 mt-1">
                Od lipca 2023 r. obowiązuje nowa <strong>ramowa umowa UE-USA</strong> dotycząca prywatności danych,
                zastępująca unieważniony Privacy Shield. Niektórzy dostawcy (np. Google, Stripe) są certyfikowani
                w ramach tego mechanizmu.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Lista certyfikowanych firm:
                <a href="https://www.dataprivacyframework.gov/s/participant-search" className="text-blue-600 underline ml-1"
                   target="_blank" rel="noopener noreferrer">
                  https://www.dataprivacyframework.gov/s/participant-search
                </a>
              </p>
            </div>

            <div>
              <strong className="text-gray-900">c) Dodatkowe środki bezpieczeństwa:</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Szyfrowanie danych w tranzycie (TLS 1.3) i w spoczynku (AES-256),</li>
                <li>Pseudonimizacja danych technicznych (adresy IP),</li>
                <li>Minimalizacja przekazywanych danych (tylko niezbędne do świadczenia usługi),</li>
                <li>Ograniczona retencja danych (okresy przechowywania określone w sekcji II).</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Szczegóły przekazań poza EOG</h3>

          <div className="ml-4 space-y-3">
            <div>
              <strong className="text-gray-900">Vercel (USA - Amazon AWS):</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Kategorie danych: dane Konta, dane techniczne, logi</li>
                <li>Zabezpieczenia: SCC + szyfrowanie + certyfikat SOC 2 Type II</li>
                <li>Więcej: <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 underline"
                   target="_blank" rel="noopener noreferrer">https://vercel.com/legal/privacy-policy</a></li>
              </ul>
            </div>

            <div>
              <strong className="text-gray-900">Stripe (Irlandia + USA backup):</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Kategorie danych: dane płatności (tokeny kart), historia transakcji</li>
                <li>Zabezpieczenia: SCC + PCI DSS Level 1 + EU-U.S. Data Privacy Framework</li>
                <li>Dane kart przechowywane w tokenizowanej formie (nie mamy dostępu do pełnych numerów kart)</li>
                <li>Więcej: <a href="https://stripe.com/privacy" className="text-blue-600 underline"
                   target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a></li>
              </ul>
            </div>

            <div>
              <strong className="text-gray-900">Resend (USA - Amazon SES):</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Kategorie danych: adresy email, treść emaili transakcyjnych</li>
                <li>Zabezpieczenia: SCC + szyfrowanie + certyfikat SOC 2 Type II</li>
                <li>Retencja emaili: 30 dni (następnie automatyczne usunięcie)</li>
              </ul>
            </div>

            <div>
              <strong className="text-gray-900">Google OAuth (USA):</strong>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-1">
                <li>Kategorie danych: email, imię, nazwisko (tylko jeśli wybrano logowanie przez Google)</li>
                <li>Zabezpieczenia: EU-U.S. Data Privacy Framework + ISO 27001</li>
                <li>Więcej: <a href="https://policies.google.com/privacy" className="text-blue-600 underline"
                   target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-2">⚠️ Prawo do sprzeciwu wobec przekazania danych poza EOG:</h4>
          <p className="text-sm text-gray-700 mb-2">
            Jeśli nie wyrażasz zgody na przekazywanie danych do USA, możesz wnieść sprzeciw, kontaktując się z nami
            na adres <strong>kontakt@otoraport.pl</strong>. Należy jednak pamiętać, że może to skutkować niemożnością
            świadczenia niektórych Usług (np. płatności przez Stripe, hosting aplikacji).
          </p>
          <p className="text-sm text-gray-700">
            Alternatywnie możemy rozważyć migrację infrastruktury do dostawców wyłącznie z EOG (dodatkowe koszty).
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">VI. PRAWA OSÓB, KTÓRYCH DANE DOTYCZĄ</h2>

        <p className="text-gray-700 mb-4">
          Zgodnie z RODO (art. 15-22) oraz polską ustawą o ochronie danych osobowych przysługują Ci następujące prawa.
          Aby skorzystać z praw, napisz do nas na <strong>kontakt@otoraport.pl</strong> (temat: "RODO - wniosek o...").
        </p>

        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-1">1. Prawo dostępu do danych (art. 15 RODO)</h3>
            <p className="text-gray-700 text-sm mb-2">
              Masz prawo uzyskać potwierdzenie, czy przetwarzamy Twoje dane osobowe, a jeśli tak - dostęp do nich
              oraz informacje o:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm ml-4 space-y-1">
              <li>Celach przetwarzania,</li>
              <li>Kategoriach przetwarzanych danych,</li>
              <li>Odbiorcach danych,</li>
              <li>Okresie przechowywania,</li>
              <li>Prawach przysługujących osobie, której dane dotyczą.</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Termin realizacji:</strong> Bez zbędnej zwłoki, nie później niż w ciągu <strong>1 miesiąca</strong>
              od otrzymania wniosku (możliwe przedłużenie o 2 miesiące w skomplikowanych przypadkach).
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-1">2. Prawo do sprostowania danych (art. 16 RODO)</h3>
            <p className="text-gray-700 text-sm">
              Możesz żądać sprostowania (poprawienia) nieprawidłowych lub niekompletnych danych osobowych.
              Możesz to zrobić również samodzielnie w panelu Konta (Ustawienia → Profil).
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Termin realizacji:</strong> Bez zbędnej zwłoki.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-1">3. Prawo do usunięcia danych - "prawo do bycia zapomnianym" (art. 17 RODO)</h3>
            <p className="text-gray-700 text-sm mb-2">
              Możesz żądać usunięcia danych osobowych, gdy:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm ml-4 space-y-1">
              <li>Dane nie są już niezbędne do celów, dla których zostały zebrane,</li>
              <li>Cofnąłeś zgodę (jeśli przetwarzanie opierało się na zgodzie),</li>
              <li>Wnosisz sprzeciw wobec przetwarzania (i nie występują nadrzędne prawnie uzasadnione podstawy),</li>
              <li>Dane przetwarzane są niezgodnie z prawem,</li>
              <li>Dane muszą być usunięte w celu wywiązania się z obowiązku prawnego.</li>
            </ul>
            <p className="text-sm text-amber-700 mt-2">
              <strong>⚠️ Ograniczenia:</strong> Nie możemy usunąć danych, jeśli przetwarzanie jest niezbędne do:
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 ml-4 mt-1">
              <li>Wywiązania się z obowiązku prawnego (np. przechowywanie faktur przez 5 lat),</li>
              <li>Ustalenia, dochodzenia lub obrony roszczeń (do czasu przedawnienia),</li>
              <li>Wykonania umowy (podczas trwania Subskrypcji).</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Termin realizacji:</strong> Bez zbędnej zwłoki.
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-1">4. Prawo do ograniczenia przetwarzania (art. 18 RODO)</h3>
            <p className="text-gray-700 text-sm mb-2">
              Możesz żądać ograniczenia przetwarzania (dane będą tylko przechowywane), gdy:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm ml-4 space-y-1">
              <li>Kwestionujesz prawidłowość danych (na czas weryfikacji),</li>
              <li>Przetwarzanie jest niezgodne z prawem, ale nie chcesz usunięcia danych,</li>
              <li>Dane nie są już potrzebne Administratorowi, ale są Tobie potrzebne do ustalenia/dochodzenia roszczeń,</li>
              <li>Wniosłeś sprzeciw wobec przetwarzania (na czas weryfikacji).</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Termin realizacji:</strong> Bez zbędnej zwłoki.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-1">5. Prawo do przenoszenia danych (art. 20 RODO)</h3>
            <p className="text-gray-700 text-sm mb-2">
              Możesz otrzymać swoje dane w ustrukturyzowanym, powszechnie używanym formacie (np. JSON, CSV) i przesłać
              je innemu administratorowi, jeśli:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm ml-4 space-y-1">
              <li>Przetwarzanie odbywa się na podstawie umowy lub zgody,</li>
              <li>Przetwarzanie odbywa się w sposób zautomatyzowany.</li>
            </ul>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Zakres danych:</strong> dane Konta, dane z przesłanych plików CSV/Excel, historia transakcji.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Termin realizacji:</strong> W ciągu 1 miesiąca (możliwe przedłużenie o 2 miesiące).
            </p>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-1">6. Prawo do sprzeciwu (art. 21 RODO)</h3>
            <p className="text-gray-700 text-sm mb-2">
              Możesz wnieść sprzeciw wobec przetwarzania danych osobowych, gdy przetwarzanie odbywa się na podstawie
              <strong> prawnie uzasadnionego interesu</strong> (art. 6 ust. 1 lit. f RODO), w szczególności:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm ml-4 space-y-1">
              <li>Bezpieczeństwo i przeciwdziałanie nadużyciom (logi, rate limiting),</li>
              <li>Analiza statystyczna i optymalizacja Serwisu (Vercel Analytics),</li>
              <li>Dochodzenie roszczeń.</li>
            </ul>
            <p className="text-sm text-gray-700 mt-2">
              Administrator zaprzestanie przetwarzania, chyba że wykaże istnienie ważnych prawnie uzasadnionych podstaw
              nadrzędnych wobec Twoich interesów (np. ochrona przed atakami cybernetycznymi).
            </p>
            <p className="text-sm text-amber-700 mt-2">
              <strong>⚠️ Marketing:</strong> Jeśli przetwarzanie odbywa się w celach marketingowych, masz
              <strong> bezwzględne prawo sprzeciwu</strong> - zaprzestaniemy przetwarzania niezwłocznie.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Termin realizacji:</strong> Bez zbędnej zwłoki.
            </p>
          </div>

          <div className="border-l-4 border-pink-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-1">7. Prawo do cofnięcia zgody (art. 7 ust. 3 RODO)</h3>
            <p className="text-gray-700 text-sm">
              Jeśli przetwarzanie odbywa się na podstawie zgody (np. marketing, newsletter), możesz ją cofnąć w każdej
              chwili. Cofnięcie zgody nie wpływa na zgodność z prawem dotychczasowego przetwarzania.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Jak cofnąć zgodę:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 ml-4 mt-1">
              <li>Email na kontakt@otoraport.pl (temat: "Cofnięcie zgody"),</li>
              <li>Link "Wypisz się" w stopce emaili marketingowych,</li>
              <li>Panel Konta → Ustawienia → Zgody marketingowe.</li>
            </ul>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-1">8. Prawo do wniesienia skargi do organu nadzorczego (art. 77 RODO)</h3>
            <p className="text-gray-700 text-sm mb-2">
              Jeśli uważasz, że przetwarzanie Twoich danych osobowych narusza RODO, możesz wnieść skargę do
              <strong> Prezesa Urzędu Ochrony Danych Osobowych (PUODO)</strong>:
            </p>
            <div className="bg-gray-50 p-3 rounded border border-gray-300 mt-2">
              <p className="text-sm text-gray-700 font-semibold">Urząd Ochrony Danych Osobowych (PUODO)</p>
              <p className="text-sm text-gray-700">ul. Stawki 2, 00-193 Warszawa</p>
              <p className="text-sm text-gray-700">Email: <strong>kancelaria@uodo.gov.pl</strong></p>
              <p className="text-sm text-gray-700">Telefon: <strong>+48 22 531 03 00</strong></p>
              <p className="text-sm text-gray-700">Strona: <a href="https://uodo.gov.pl" className="text-blue-600 underline"
                 target="_blank" rel="noopener noreferrer">https://uodo.gov.pl</a></p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Możesz również wnieść skargę do organu nadzorczego w państwie członkowskim UE, w którym zwykle przebywasz,
              pracujesz lub w którym miało miejsce domniemane naruszenie.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
          <h4 className="font-semibold text-blue-900 mb-2">Jak składać wnioski o realizację praw:</h4>
          <ol className="list-decimal list-inside text-sm text-blue-900 space-y-1">
            <li>Wyślij email na <strong>kontakt@otoraport.pl</strong> z tematem "RODO - wniosek o [nazwa prawa]",</li>
            <li>Podaj: imię, nazwisko, adres email powiązany z Kontem, szczegóły wniosku,</li>
            <li>Dołącz kopię dokumentu tożsamości (w celu weryfikacji) - zalecamy zasłonięcie danych wrażliwych (np. numer PESEL),</li>
            <li>Odpowiemy w ciągu <strong>1 miesiąca</strong> (możliwe przedłużenie o 2 miesiące w skomplikowanych przypadkach).</li>
          </ol>
          <p className="text-sm text-blue-900 mt-2">
            <strong>Bez opłat:</strong> Realizacja praw jest bezpłatna (chyba że wnioski są wyraźnie nieuzasadnione
            lub nadmierne - wówczas możemy naliczyć rozsądną opłatę).
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">VII. PLIKI COOKIES I TECHNOLOGIE ŚLEDZĄCE</h2>

        <p className="text-gray-700 mb-4">
          Serwis wykorzystuje pliki cookies oraz podobne technologie (local storage, session storage) zgodnie z ustawą
          z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną oraz Dyrektywą ePrivacy (2002/58/WE).
        </p>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Czym są pliki cookies?</h3>
          <p className="text-gray-700 text-sm">
            Cookies to małe pliki tekstowe zapisywane na Twoim urządzeniu przez przeglądarkę internetową. Umożliwiają
            zapamiętywanie informacji o Twojej wizycie, preferencjach oraz sesji logowania.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Jakie cookies wykorzystujemy?</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Nazwa cookie</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Typ</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Cel</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Ważność</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Czy wymaga zgody?</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>supabase-auth-token</strong>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Techniczny (niezbędny)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Uwierzytelnianie użytkownika, utrzymanie sesji logowania
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Do wylogowania lub 7 dni
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className="text-green-600 font-semibold">NIE</span> (art. 173 ust. 3 ustawy Prawo telekomunikacyjne)
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>_vercel_*</strong>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Techniczny (niezbędny)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Routing i load balancing (infrastruktura Vercel)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Sesja (do zamknięcia przeglądarki)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className="text-green-600 font-semibold">NIE</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <strong>__vercel_live_token</strong>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Funkcjonalny
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    Vercel Analytics (zanonimizowane statystyki ruchu - bez IP, User-Agent)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    24 godziny
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className="text-amber-600 font-semibold">TAK</span> (analityka)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
            <h4 className="font-semibold text-green-900 mb-2">Dlaczego Vercel Analytics nie wymaga zgody w niektórych interpretacjach:</h4>
            <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
              <li>Dane są <strong>całkowicie zanonimizowane</strong> - brak adresów IP, User-Agent, identyfikatorów osobowych,</li>
              <li>Służy wyłącznie do optymalizacji działania Serwisu (art. 6 ust. 1 lit. f RODO),</li>
              <li>Niektóre interpretacje RODO dopuszczają takie przetwarzanie bez zgody (art. 173 ust. 3 Prawo telekomunikacyjne).</li>
            </ul>
            <p className="text-sm text-amber-700 mt-2">
              <strong>⚠️ Zalecenie prawnika:</strong> Ze względu na rozbieżne interpretacje, zalecamy uzyskanie zgody
              lub implementację cookie banner z opcją opt-out.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Jak zarządzać plikami cookies?</h3>
          <p className="text-gray-700 text-sm mb-2">
            Możesz zarządzać plikami cookies w ustawieniach swojej przeglądarki:
          </p>
          <ul className="list-disc list-inside text-gray-700 text-sm ml-4 space-y-1">
            <li><strong>Google Chrome:</strong> Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie i inne dane witryn</li>
            <li><strong>Mozilla Firefox:</strong> Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie i dane stron</li>
            <li><strong>Safari:</strong> Preferencje → Prywatność → Blokuj wszystkie pliki cookie</li>
            <li><strong>Microsoft Edge:</strong> Ustawienia → Prywatność, wyszukiwanie i usługi → Pliki cookie</li>
          </ul>
          <p className="text-sm text-amber-700 mt-2">
            <strong>⚠️ Uwaga:</strong> Wyłączenie cookies technicznych (supabase-auth-token) uniemożliwi logowanie i
            korzystanie z Serwisu.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Nie używamy cookies marketingowych ani śledzących</h3>
          <p className="text-gray-700 text-sm">
            OTORAPORT <strong>nie wykorzystuje</strong> cookies marketingowych, reklamowych ani śledzących (tracking cookies)
            od podmiotów trzecich (np. Facebook Pixel, Google Ads, TikTok Pixel). Nie profilujemy użytkowników w celach
            marketingowych.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">VIII. BEZPIECZEŃSTWO DANYCH</h2>

        <p className="text-gray-700 mb-4">
          Zgodnie z art. 32 RODO stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony danych osobowych
          przed nieuprawnionym dostępem, utratą, zniszczeniem, modyfikacją lub ujawnieniem.
        </p>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Środki techniczne</h3>
          <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
            <li><strong>Szyfrowanie w tranzycie:</strong> Wszystkie połączenia wykorzystują protokół <strong>TLS 1.3</strong>
              (Transport Layer Security) z 256-bitowym szyfrowaniem.</li>
            <li><strong>Szyfrowanie w spoczynku:</strong> Dane przechowywane w bazie Supabase są szyfrowane algorytmem
              <strong> AES-256</strong>.</li>
            <li><strong>Hashowanie haseł:</strong> Hasła przechowywane są jako hash <strong>bcrypt</strong> (nie mamy dostępu
              do plaintext haseł).</li>
            <li><strong>Rate limiting:</strong> Ograniczenia częstotliwości żądań (60 req/min dla ministry endpoints,
              5 prób logowania/15 min) zabezpieczają przed atakami brute force.</li>
            <li><strong>Firewall i WAF:</strong> Vercel Edge Network zapewnia ochronę przed atakami DDoS, SQL Injection, XSS.</li>
            <li><strong>Backup danych:</strong> Automatyczne kopie zapasowe co 24 godziny (Supabase Point-in-Time Recovery).</li>
            <li><strong>Monitoring i logi:</strong> System wykrywania anomalii, logi dostępu przechowywane przez 90 dni.</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Środki organizacyjne</h3>
          <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
            <li><strong>Kontrola dostępu:</strong> Dostęp do danych osobowych mają tylko upoważnieni pracownicy/współpracownicy
              (zasada najmniejszych uprawnień - least privilege).</li>
            <li><strong>Umowy NDA:</strong> Wszyscy pracownicy/współpracownicy podpisują umowy o zachowaniu poufności.</li>
            <li><strong>Umowy powierzenia (DPA):</strong> Wszyscy podmioty przetwarzające (Vercel, Supabase, Stripe, Resend)
              działają na podstawie umów powierzenia zgodnych z art. 28 RODO.</li>
            <li><strong>Procedury incydentów:</strong> Określone procedury zgłaszania i reagowania na naruszenia ochrony danych
              (art. 33-34 RODO).</li>
            <li><strong>Minimalizacja danych:</strong> Zbieramy tylko dane niezbędne do świadczenia Usług (art. 5 ust. 1 lit. c RODO).</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Certyfikaty i audyty dostawców</h3>
          <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
            <li><strong>Vercel:</strong> SOC 2 Type II, ISO 27001 (w trakcie certyfikacji)</li>
            <li><strong>Supabase:</strong> SOC 2 Type II, ISO 27001</li>
            <li><strong>Stripe:</strong> PCI DSS Level 1 (najwyższy standard bezpieczeństwa płatności), SOC 2 Type II</li>
            <li><strong>Resend:</strong> SOC 2 Type II</li>
          </ul>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-2">Zgłaszanie naruszeń ochrony danych (Data Breach)</h4>
          <p className="text-sm text-gray-700 mb-2">
            W przypadku wykrycia naruszenia ochrony danych osobowych (art. 33-34 RODO):
          </p>
          <ul className="list-decimal list-inside text-sm text-gray-700 ml-4 space-y-1">
            <li>Zgłosimy naruszenie do PUODO w ciągu <strong>72 godzin</strong> od wykrycia (jeśli naruszenie stwarza ryzyko
              dla praw i wolności osób),</li>
            <li>Poinformujemy Cię o naruszeniu (jeśli naruszenie stwarza <strong>wysokie ryzyko</strong> dla Twoich praw)
              poprzez email na adres powiązany z Kontem,</li>
            <li>Podejmiemy natychmiastowe działania naprawcze (zmiana haseł, blokada dostępu, analiza forensic).</li>
          </ul>
          <p className="text-sm text-gray-700 mt-2">
            <strong>Jak zgłosić podejrzenie naruszenia:</strong> Email na <strong>kontakt@otoraport.pl</strong>
            z tematem "PILNE - Naruszenie bezpieczeństwa".
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">IX. PROFILOWANIE I ZAUTOMATYZOWANE PODEJMOWANIE DECYZJI</h2>

        <p className="text-gray-700 mb-4">
          <strong>OTORAPORT NIE stosuje profilowania</strong> ani zautomatyzowanego podejmowania decyzji w rozumieniu
          art. 22 RODO.
        </p>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">Co to oznacza?</h4>
          <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
            <li>Nie tworzymy profili użytkowników na podstawie analizy zachowań, preferencji czy danych demograficznych,</li>
            <li>Nie podejmujemy automatycznych decyzji wywołujących skutki prawne lub w podobny sposób znacząco wpływających
              na użytkowników (np. automatyczne odrzucanie wniosków, automatyczne ustalanie cen),</li>
            <li>Wszystkie decyzje biznesowe (np. akceptacja płatności, rozpatrzenie reklamacji) są podejmowane przez ludzi.</li>
          </ul>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          <strong>Wyjątek:</strong> Rate limiting (ograniczenia częstotliwości żądań) jest automatyczny, ale nie stanowi
          profilowania w rozumieniu RODO - służy wyłącznie zabezpieczeniu systemów przed nadużyciami.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">X. ZMIANY W POLITYCE PRYWATNOŚCI</h2>

        <p className="text-gray-700 mb-4">
          Polityka Prywatności może ulegać zmianom w celu dostosowania do zmieniających się przepisów prawa, nowych
          funkcjonalności Serwisu lub praktyk przetwarzania danych.
        </p>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Procedura wprowadzania zmian:</h3>
          <ol className="list-decimal list-inside text-gray-700 ml-4 space-y-2">
            <li>O planowanej zmianie Polityki Prywatności poinformujemy Użytkowników z wyprzedzeniem
              <strong> co najmniej 14 dni kalendarzowych</strong> poprzez:
              <ul className="list-disc ml-8 mt-1 space-y-1">
                <li>Email na adres powiązany z Kontem,</li>
                <li>Komunikat widoczny po zalogowaniu do Serwisu.</li>
              </ul>
            </li>
            <li>Zmieniona Polityka Prywatności wchodzi w życie z dniem wskazanym w powiadomieniu (nie wcześniej niż
              po upływie 14 dni od wysłania powiadomienia).</li>
            <li>Kontynuowanie korzystania z Serwisu po wejściu w życie zmian oznacza akceptację nowej Polityki Prywatności.</li>
            <li>Jeśli nie akceptujesz zmian, masz prawo do wypowiedzenia umowy (anulowania Subskrypcji) przed datą
              wejścia w życie zmian.</li>
          </ol>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Aktualna wersja Polityki Prywatności</strong> jest zawsze dostępna pod adresem:
            <strong> otoraport.pl/privacy</strong>
          </p>
          <p className="text-sm text-blue-900 mt-2">
            Data ostatniej aktualizacji: <strong>3 października 2025 r.</strong>
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">XI. POSTANOWIENIA KOŃCOWE</h2>

        <p className="text-gray-700 mb-4">
          <strong>1.</strong> W sprawach nieuregulowanych niniejszą Polityką Prywatności zastosowanie mają przepisy:
        </p>
        <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
          <li>Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO),</li>
          <li>Ustawy z dnia 10 maja 2018 r. o ochronie danych osobowych (Dz.U. 2018 poz. 1000 z późn. zm.),</li>
          <li>Ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną (Dz.U. 2002 nr 144 poz. 1204 z późn. zm.),</li>
          <li>Ustawy z dnia 16 lipca 2004 r. Prawo telekomunikacyjne (Dz.U. 2004 nr 171 poz. 1800 z późn. zm.).</li>
        </ul>

        <p className="text-gray-700 mt-4 mb-4">
          <strong>2.</strong> W przypadku pytań dotyczących Polityki Prywatności lub przetwarzania danych osobowych prosimy o kontakt:
        </p>
        <ul className="list-none space-y-1 text-gray-700 ml-4">
          <li>Email: <strong>kontakt@otoraport.pl</strong></li>
          <li>Telefon: <strong>[NUMER TELEFONU]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
          <li>Adres korespondencyjny: <strong>[ADRES SIEDZIBY]</strong> <span className="text-red-600">[DO UZUPEŁNIENIA]</span></li>
        </ul>
      </section>

      <div className="mt-12 p-6 bg-amber-50 rounded-lg border-2 border-amber-400">
        <h3 className="text-lg font-bold text-amber-900 mb-3">⚠️ UWAGA PRAWNA - WYMAGANA WERYFIKACJA</h3>
        <p className="text-sm text-amber-800 mb-3">
          <strong>Powyższa treść Polityki Prywatności ma charakter projektowy i wymaga obowiązkowej weryfikacji oraz
          akceptacji przez radcę prawnego lub adwokata specjalizującego się w ochronie danych osobowych (RODO).</strong>
        </p>

        <div className="bg-white p-4 rounded border border-amber-300 mb-3">
          <p className="text-sm font-semibold text-gray-900 mb-2">DO UZUPEŁNIENIA PRZEZ WŁAŚCICIELA FIRMY:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li><strong>[NAZWA FIRMY]</strong> - pełna nazwa prawna (np. "Tech Solutions Sp. z o.o.")</li>
            <li><strong>[sp. z o.o. / S.A. / inne]</strong> - forma prawna działalności</li>
            <li><strong>[ADRES SIEDZIBY]</strong> - pełny adres (ulica, nr budynku/lokalu, kod pocztowy, miasto)</li>
            <li><strong>[NIP]</strong> - 10-cyfrowy numer NIP (format: 123-456-78-90)</li>
            <li><strong>[REGON]</strong> - 9 lub 14-cyfrowy numer REGON</li>
            <li><strong>[NUMER KRS lub CEiDG]</strong> - numer z Krajowego Rejestru Sądowego lub Centralnej Ewidencji
              i Informacji o Działalności Gospodarczej</li>
            <li><strong>[NUMER TELEFONU]</strong> - telefon kontaktowy dla użytkowników (format: +48 123 456 789)</li>
            <li><strong>[EMAIL_IOD / ADRES_IOD]</strong> - jeśli został wyznaczony Inspektor Ochrony Danych</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded border border-amber-300 mb-3">
          <p className="text-sm font-semibold text-gray-900 mb-2">WYMAGANA KONSULTACJA PRAWNA W ZAKRESIE:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Czy wymagane jest powołanie Inspektora Ochrony Danych (IOD/DPO) dla tego typu działalności</li>
            <li>Zgodność z najnowszymi wytycznymi PUODO i EDPB (Europejska Rada Ochrony Danych)</li>
            <li>Weryfikacja podstaw prawnych przetwarzania (sekcja II) - czy wszystkie są poprawnie przypisane</li>
            <li>Przekazywanie danych poza EOG (sekcja V) - weryfikacja SCC i EU-U.S. Data Privacy Framework</li>
            <li>Polityka cookies (sekcja VII) - czy Vercel Analytics wymaga zgody (rozbieżne interpretacje)</li>
            <li>Procedury Data Breach (sekcja VIII) - czy są kompletne i zgodne z art. 33-34 RODO</li>
            <li>Ocena ryzyka (DPIA) - czy wymagana dla profilu działalności OTORAPORT</li>
            <li>Weryfikacja umów powierzenia (DPA) z dostawcami - czy aktualne i zgodne z RODO</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded border border-amber-300">
          <p className="text-sm font-semibold text-gray-900 mb-2">DO DOPRECYZOWANIA Z PRAWNIKIEM:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Czy Supabase database jest w UE (Frankfurt) czy USA - zależy od konfiguracji projektu</li>
            <li>Czy Google OAuth jest obowiązkowy czy opcjonalny - wpływa na ocenę przekazania do USA</li>
            <li>Dokładne okresy retencji danych księgowych i podatkowych (5 lat - czy zgodne z Ordynacją podatkową)</li>
            <li>Czy działalność wymaga dodatkowych certyfikatów/audytów (np. ISO 27001)</li>
          </ul>
        </div>
      </div>
    </LegalLayout>
  )
}

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-3">OTORAPORT</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Automatyzacja compliance dla deweloperów nieruchomości. 
                Generowanie raportów XML/MD zgodnych z wymogami ministerstwa.
              </p>
            </div>
            <div className="text-gray-400 text-xs">
              <p>OTORAPORT Sp. z o.o.</p>
              <p>ul. Technologiczna 15</p>
              <p>00-001 Warszawa</p>
              <p>NIP: 1234567890</p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produkt</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-blue-400 transition-colors">
                  Upload danych
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-400 transition-colors">
                  Cennik
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-blue-400 transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Wsparcie</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href="/docs" className="hover:text-blue-400 transition-colors">
                  Dokumentacja
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-blue-400 transition-colors">
                  Status systemu
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@otoraport.pl" 
                  className="hover:text-blue-400 transition-colors"
                >
                  support@otoraport.pl
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Dokumenty prawne</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors">
                  Polityka prywatności
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-400 transition-colors">
                  Regulamin
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-blue-400 transition-colors">
                  Polityka cookies
                </Link>
              </li>
              <li>
                <Link href="/rodo" className="hover:text-blue-400 transition-colors">
                  Klauzule RODO
                </Link>
              </li>
            </ul>
            
            <div className="mt-6">
              <h5 className="font-medium text-white mb-2 text-sm">Kontakt RODO</h5>
              <p className="text-gray-400 text-xs">
                <a 
                  href="mailto:dpo@otoraport.pl" 
                  className="hover:text-blue-400 transition-colors"
                >
                  dpo@otoraport.pl
                </a>
              </p>
              <p className="text-gray-400 text-xs">
                Inspektor Ochrony Danych
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} OTORAPORT Sp. z o.o. Wszystkie prawa zastrzeżone.
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="text-gray-400">
                Zgodność z RODO | Hosting EU | SSL
              </div>
              
              <div className="flex items-center gap-4">
                <Link 
                  href="/privacy" 
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  Prywatność
                </Link>
                <Link 
                  href="/terms" 
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  Regulamin
                </Link>
                <Link 
                  href="/cookies" 
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
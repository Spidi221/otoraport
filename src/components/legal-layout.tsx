import Link from 'next/link'
import { OtoRaportLogo } from '@/components/icons/oto-raport-logo'
import { ArrowLeft } from 'lucide-react'

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <OtoRaportLogo />
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do strony głównej
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <header className="mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            <p className="text-sm text-gray-500">
              Ostatnia aktualizacja: {lastUpdated}
            </p>
          </header>

          <div className="prose prose-gray max-w-none">
            {children}
          </div>
        </article>

        {/* Navigation */}
        <nav className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-gray-600">
          <Link href="/terms" className="hover:text-gray-900">
            Regulamin
          </Link>
          <span className="text-gray-300">•</span>
          <Link href="/privacy" className="hover:text-gray-900">
            Polityka Prywatności
          </Link>
          <span className="text-gray-300">•</span>
          <Link href="/auth/signin" className="hover:text-gray-900">
            Logowanie
          </Link>
          <span className="text-gray-300">•</span>
          <Link href="mailto:kontakt@oto-raport.pl" className="hover:text-gray-900">
            Kontakt
          </Link>
        </nav>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} OTO-RAPORT. Wszystkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  )
}

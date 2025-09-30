import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OtoraportLogo } from '@/components/icons/otoraport-logo'
import { Home, Search, ArrowLeft, HelpCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <OtoraportLogo className="h-12 w-auto" />
          </div>

          {/* 404 Animation */}
          <div className="relative">
            <div className="text-9xl font-bold text-gray-200 select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-16 h-16 text-blue-600 animate-pulse" />
            </div>
          </div>

          <CardTitle className="text-3xl font-bold">Strona nie została znaleziona</CardTitle>
          <CardDescription className="text-lg">
            Wygląda na to, że strona, której szukasz nie istnieje lub została przeniesiona.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Helpful Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <HelpCircle className="w-4 h-4 mr-2" />
              Co możesz zrobić?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
              <li>Sprawdź czy adres URL jest poprawny</li>
              <li>Wróć do strony głównej i spróbuj ponownie</li>
              <li>Skorzystaj z wyszukiwarki w centrum pomocy</li>
              <li>Skontaktuj się z naszym wsparciem technicznym</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                <Home className="w-4 h-4 mr-2" />
                Wróć do Dashboard
              </Button>
            </Link>

            <Link href="/help" className="w-full">
              <Button variant="outline" className="w-full">
                <HelpCircle className="w-4 h-4 mr-2" />
                Centrum Pomocy
              </Button>
            </Link>
          </div>

          {/* Back Button */}
          <div className="text-center pt-4">
            <Link
              href="javascript:history.back()"
              className="text-sm text-gray-600 hover:text-gray-800 inline-flex items-center"
              onClick={(e) => {
                e.preventDefault()
                window.history.back()
              }}
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Wróć do poprzedniej strony
            </Link>
          </div>

          {/* Support Contact */}
          <div className="border-t pt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Potrzebujesz pomocy?
            </p>
            <Link href="mailto:support@otoraport.pl" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              support@otoraport.pl
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

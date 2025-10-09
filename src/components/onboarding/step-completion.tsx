'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Home, Settings, Link as LinkIcon, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StepCompletionProps {
  onComplete: () => void;
}

export function StepCompletion({ onComplete }: StepCompletionProps) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    onComplete();
    router.push('/dashboard');
  };

  const nextSteps = [
    {
      icon: Home,
      title: 'Dashboard',
      description: 'Zarządzaj nieruchomościami i przeglądaj statystyki',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: LinkIcon,
      title: 'Endpointy',
      description: 'Udostępnij dane Ministerstwu poprzez publiczne API',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Settings,
      title: 'Ustawienia',
      description: 'Dostosuj swój profil i preferencje konta',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Success Animation Area */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 animate-bounce-slow">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Gotowe! 🎉
        </h1>
        <p className="text-lg text-gray-600">
          Twoje konto jest skonfigurowane i gotowe do użycia
        </p>
      </div>

      {/* Success Message Card */}
      <Card className="p-8 mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Witamy w OTORAPORT!
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Pomyślnie ukończyłeś konfigurację konta. Teraz możesz w pełni korzystać z
              platformy do automatyzacji raportowania dla Ministerstwa Rozwoju.
            </p>
          </div>
        </div>
      </Card>

      {/* What's Next Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Co dalej?
        </h2>

        <div className="space-y-3">
          {nextSteps.map((step, index) => (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', step.bgColor)}>
                  <step.icon className={cn('w-6 h-6', step.color)} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <Card className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            Zacznij zarządzać swoimi nieruchomościami
          </h3>
          <p className="text-blue-100 mb-6">
            Przejdź do panelu głównego i odkryj wszystkie możliwości OTORAPORT
          </p>

          <Button
            type="button"
            size="lg"
            onClick={handleGoToDashboard}
            className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 h-auto font-semibold"
          >
            <Home className="w-5 h-5 mr-2" />
            Przejdź do dashboardu
          </Button>
        </div>
      </Card>

      {/* Additional Resources */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-2">
          Potrzebujesz pomocy?
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <a
            href="/docs"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Dokumentacja
          </a>
          <span className="text-gray-300">•</span>
          <a
            href="/support"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Pomoc techniczna
          </a>
          <span className="text-gray-300">•</span>
          <a
            href="/faq"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            FAQ
          </a>
        </div>
      </div>
    </div>
  );
}

// Helper function for className concatenation (if not using cn from utils)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

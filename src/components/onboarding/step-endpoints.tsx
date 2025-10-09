'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { type OnboardingState } from '@/hooks/use-onboarding-wizard';
import { cn } from '@/lib/utils';

interface StepEndpointsProps {
  endpointTests: OnboardingState['endpointTests'];
  clientId: string;
  onTestEndpoint: (endpoint: 'xml' | 'csv' | 'md5') => void;
  onTestAll: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepEndpoints({
  endpointTests,
  clientId,
  onTestEndpoint,
  onTestAll,
  onNext,
  onBack,
}: StepEndpointsProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://oto-raport.pl';

  const endpoints = [
    {
      id: 'xml' as const,
      label: 'Endpoint XML dla Ministerstwa',
      description: 'Format XML zgodny z wymaganiami Ministerstwa Rozwoju',
      url: `${baseUrl}/api/public/${clientId}/data.xml`,
      icon: '📄',
    },
    {
      id: 'csv' as const,
      label: 'Endpoint CSV',
      description: 'Dane w formacie CSV do dalszej analizy',
      url: `${baseUrl}/api/public/${clientId}/data.csv`,
      icon: '📊',
    },
    {
      id: 'md5' as const,
      label: 'MD5 Checksum',
      description: 'Suma kontrolna MD5 dla weryfikacji integralności danych',
      url: `${baseUrl}/api/public/${clientId}/data.md5`,
      icon: '🔐',
    },
  ];

  const handleCopy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedEndpoint(id);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const allTested = Object.values(endpointTests).every(
    (test) => test.status !== 'idle'
  );

  const allSuccess = Object.values(endpointTests).every(
    (test) => test.status === 'success'
  );

  const anyLoading = Object.values(endpointTests).some(
    (test) => test.status === 'loading'
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Twoje endpointy są gotowe! 🎉
        </h1>
        <p className="text-base text-gray-600">
          Sprawdź czy wszystko działa poprawnie
        </p>
      </div>

      {/* Endpoints Grid */}
      <div className="space-y-4 mb-6">
        {endpoints.map((endpoint) => {
          const test = endpointTests[endpoint.id];
          const isLoading = test.status === 'loading';
          const isSuccess = test.status === 'success';
          const isError = test.status === 'error';
          const isCopied = copiedEndpoint === endpoint.id;

          return (
            <Card
              key={endpoint.id}
              className={cn(
                'p-6 transition-all duration-200',
                isSuccess && 'border-green-300 bg-green-50/50',
                isError && 'border-red-300 bg-red-50/50'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-4xl flex-shrink-0">{endpoint.icon}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {endpoint.label}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {endpoint.description}
                  </p>

                  {/* URL */}
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-700 flex-1 overflow-x-auto">
                        {endpoint.url}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(endpoint.url, endpoint.id)}
                        className="flex-shrink-0"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onTestEndpoint(endpoint.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testowanie...
                          </>
                        ) : (
                          'Testuj'
                        )}
                      </Button>

                      <a
                        href={endpoint.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        Otwórz
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Status Indicator */}
                    {test.status !== 'idle' && (
                      <div className="flex items-center gap-2">
                        {isLoading && (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        )}
                        {isSuccess && (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-700">
                              {test.message || 'Działa poprawnie'}
                            </span>
                          </>
                        )}
                        {isError && (
                          <>
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-red-700">
                              {test.message || 'Błąd'}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Test All Button */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Przetestuj wszystkie endpointy
            </h3>
            <p className="text-sm text-gray-600">
              Sprawdź wszystkie endpointy jednocześnie
            </p>
          </div>

          <Button
            type="button"
            onClick={onTestAll}
            disabled={anyLoading}
            className="min-w-[140px]"
          >
            {anyLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testowanie...
              </>
            ) : (
              'Testuj wszystkie'
            )}
          </Button>
        </div>

        {allTested && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            {allSuccess ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  Wszystkie endpointy działają poprawnie!
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">
                  Niektóre endpointy wymagają uwagi
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <Card className="p-6">
        <div className="flex justify-between items-center">
          <Button type="button" variant="outline" onClick={onBack}>
            Wstecz
          </Button>

          <Button
            type="button"
            onClick={onNext}
            size="lg"
            className="min-w-[140px]"
          >
            Dalej
          </Button>
        </div>
      </Card>

      {/* Help text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Te endpointy możesz udostępnić Ministerstwu Rozwoju do automatycznego pobierania danych
        </p>
      </div>
    </div>
  );
}

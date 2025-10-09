'use client';

import { Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CodeExamples } from './code-block';
import { API_ENDPOINTS, type APIEndpoint } from '@/lib/help-content';

interface APIDocsSectionProps {
  userPlan?: 'free' | 'pro' | 'enterprise';
}

export function APIDocsSection({ userPlan = 'free' }: APIDocsSectionProps) {
  const isEnterprise = userPlan === 'enterprise';

  if (!isEnterprise) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Dokumentacja API
          </h3>
          <p className="text-gray-600 mb-6">
            Dostęp do API jest dostępny tylko dla użytkowników planu Enterprise.
            Zintegruj OTO-RAPORT z Twoim systemem CRM lub ERP.
          </p>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Plan Enterprise obejmuje:</h4>
            <ul className="text-sm text-gray-700 space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                Pełny dostęp do REST API
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                Nielimitowane API calls
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                Webhooks dla real-time updates
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                Dedykowane wsparcie techniczne
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                Dokumentacja API z przykładami
              </li>
            </ul>
          </div>

          <Button size="lg" onClick={() => window.location.href = '/dashboard/settings?tab=subscription'}>
            Upgrade do Enterprise
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            Lub <a href="#contact" className="text-blue-600 hover:underline">skontaktuj się z nami</a> aby omówić Twoje potrzeby
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Dokumentacja API</h3>
        <p className="text-gray-600 mb-6">
          OTO-RAPORT API pozwala na programatyczne zarządzanie nieruchomościami.
          Wszystkie endpointy wymagają uwierzytelniania przez API key.
        </p>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Base URL:</strong> <code className="text-sm bg-gray-100 px-2 py-1 rounded">https://oto-raport.pl/api</code>
            <br />
            <strong>Authentication:</strong> Dodaj header <code className="text-sm bg-gray-100 px-2 py-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
          </AlertDescription>
        </Alert>
      </div>

      {/* Authentication Section */}
      <Card>
        <CardHeader>
          <CardTitle>Uwierzytelnianie</CardTitle>
          <CardDescription>
            Jak uzyskać i używać API key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Uzyskanie API Key:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Przejdź do <strong>Ustawienia → API Configuration</strong></li>
              <li>Kliknij "Wygeneruj nowy API Key"</li>
              <li>Skopiuj i bezpiecznie zapisz klucz (nie będzie ponownie wyświetlony)</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Przykład użycia:</h4>
            <CodeExamples
              examples={{
                curl: `curl -X GET "https://oto-raport.pl/api/properties" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
                javascript: `const apiKey = 'YOUR_API_KEY';

fetch('https://oto-raport.pl/api/properties', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data));`,
                python: `import requests

api_key = 'YOUR_API_KEY'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://oto-raport.pl/api/properties',
    headers=headers
)
data = response.json()`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Endpointy API</h3>

        {API_ENDPOINTS.map((endpoint) => (
          <APIEndpointCard key={endpoint.path} endpoint={endpoint} />
        ))}
      </div>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
          <CardDescription>
            Limity zapytań API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <strong>Enterprise Plan:</strong>
              <p className="text-sm text-gray-600">
                10,000 requests/godzinę
              </p>
            </div>
            <div className="text-sm text-gray-600">
              Przy przekroczeniu limitu otrzymasz response z kodem 429 (Too Many Requests).
              Nagłówki odpowiedzi zawierają informacje o limitach:
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><code>X-RateLimit-Limit</code> - Maksymalna liczba requestów</li>
              <li><code>X-RateLimit-Remaining</code> - Pozostałe requesty</li>
              <li><code>X-RateLimit-Reset</code> - Timestamp resetowania limitu</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Individual API Endpoint Card
function APIEndpointCard({ endpoint }: { endpoint: APIEndpoint }) {
  const methodColors = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-green-100 text-green-700',
    PUT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
  };

  return (
    <Card id={`api-${endpoint.path.replace(/\//g, '-')}`}>
      <CardHeader>
        <div className="flex items-center space-x-3 mb-2">
          <Badge className={methodColors[endpoint.method]}>
            {endpoint.method}
          </Badge>
          <code className="text-sm font-mono">{endpoint.path}</code>
          {!endpoint.authentication && (
            <Badge variant="secondary">Public</Badge>
          )}
        </div>
        <CardDescription>{endpoint.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Parameters */}
        {endpoint.parameters && endpoint.parameters.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Parametry:</h4>
            <div className="space-y-3">
              {endpoint.parameters.map((param) => (
                <div key={param.name} className="text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <code className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {param.name}
                    </code>
                    <span className="text-gray-500">{param.type}</span>
                    {param.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-gray-600">{param.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Body */}
        {endpoint.requestBody && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Request Body:</h4>
            <div className="space-y-3">
              <div className="text-sm space-y-2">
                {Object.entries(endpoint.requestBody.schema).map(([key, value]) => (
                  <div key={key} className="flex items-start space-x-2">
                    <code className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {key}
                    </code>
                    <span className="text-gray-600 text-xs">{String(value)}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Przykład:</p>
                <CodeExamples
                  examples={{
                    curl: endpoint.codeExamples.curl,
                    javascript: endpoint.codeExamples.javascript,
                    python: endpoint.codeExamples.python,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Responses */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Odpowiedzi:</h4>
          <div className="space-y-3">
            {endpoint.responses.map((response) => (
              <div key={response.code}>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge
                    className={
                      response.code >= 200 && response.code < 300
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }
                  >
                    {response.code}
                  </Badge>
                  <span className="text-sm text-gray-600">{response.description}</span>
                </div>
                <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                  <code>{response.example}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Code Examples (if no request body) */}
        {!endpoint.requestBody && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Przykłady:</h4>
            <CodeExamples examples={endpoint.codeExamples} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

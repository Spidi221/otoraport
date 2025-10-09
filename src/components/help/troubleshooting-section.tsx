'use client';

import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TROUBLESHOOTING_ISSUES, FAQ_ITEMS, type TroubleshootingIssue } from '@/lib/help-content';

export function TroubleshootingSection() {
  return (
    <div className="space-y-6">
      {TROUBLESHOOTING_ISSUES.map((issue) => (
        <TroubleshootingCard key={issue.id} issue={issue} />
      ))}

      {/* Still Having Issues */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Dalej masz problem?</strong> Skontaktuj się z naszym zespołem wsparcia.
          Jesteśmy dostępni aby pomóc!{' '}
          <a href="#contact" className="text-blue-600 hover:underline font-medium">
            Przejdź do kontaktu
          </a>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function TroubleshootingCard({ issue }: { issue: TroubleshootingIssue }) {
  return (
    <Card id={`troubleshooting-${issue.id}`}>
      <CardHeader>
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{issue.problem}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Causes */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold mr-2">
              ?
            </span>
            Możliwe przyczyny:
          </h4>
          <ul className="space-y-2">
            {issue.causes.map((cause, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <span className="text-amber-600 mr-2 flex-shrink-0">•</span>
                <span>{cause}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Solutions */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold mr-2">
              ✓
            </span>
            Rozwiązania:
          </h4>
          <ol className="space-y-3">
            {issue.solutions.map((solution, index) => (
              <li key={index} className="flex items-start text-sm">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-700">{solution}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Related Articles */}
        {issue.relatedArticles && issue.relatedArticles.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Powiązane artykuły:
            </h4>
            <div className="flex flex-wrap gap-2">
              {issue.relatedArticles.map((articleId) => {
                const article = FAQ_ITEMS.find((f) => f.id === articleId);
                if (!article) return null;

                return (
                  <a
                    key={articleId}
                    href={`#faq-${articleId}`}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(`faq-${articleId}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{article.question}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Action */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Problem się utrzymuje?
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '#contact'}>
              Zgłoś do supportu
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

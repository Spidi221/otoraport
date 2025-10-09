'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { FAQ_ITEMS, FAQ_CATEGORIES, type FAQItem } from '@/lib/help-content';

interface FAQAccordionProps {
  category?: string;
  searchQuery?: string;
}

export function FAQAccordion({ category, searchQuery }: FAQAccordionProps) {
  const [feedback, setFeedback] = useState<Record<string, 'helpful' | 'not-helpful' | null>>({});

  // Filter FAQs by category or search
  const filteredFAQs = FAQ_ITEMS.filter(item => {
    if (category && item.category !== category) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.keywords.some(k => k.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Group FAQs by category
  const groupedFAQs = filteredFAQs.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  const handleFeedback = async (faqId: string, helpful: boolean) => {
    setFeedback(prev => ({ ...prev, [faqId]: helpful ? 'helpful' : 'not-helpful' }));

    // Track feedback (you can implement API call here)
    try {
      await fetch('/api/help/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faqId,
          helpful,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  const highlightText = (text: string) => {
    if (!searchQuery) return text;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (filteredFAQs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Nie znaleziono pytań</p>
        <Button variant="outline" onClick={() => window.location.href = '#contact'}>
          Zadaj pytanie supportowi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedFAQs).map(([categoryName, items]) => (
        <div key={categoryName}>
          {/* Category Header */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">
              {items.length}
            </span>
            {categoryName}
          </h3>

          {/* FAQ Items */}
          <Accordion type="single" collapsible className="space-y-2">
            {items.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                id={`faq-${item.id}`}
                className="border rounded-lg px-4 bg-white"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="text-sm font-medium text-gray-900">
                    {highlightText(item.question)}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {/* Answer */}
                  <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">
                    {highlightText(item.answer)}
                  </div>

                  {/* Related Articles */}
                  {item.relatedArticles && item.relatedArticles.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Powiązane artykuły:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.relatedArticles.map((articleId) => {
                          const relatedFAQ = FAQ_ITEMS.find(f => f.id === articleId);
                          if (!relatedFAQ) return null;

                          return (
                            <a
                              key={articleId}
                              href={`#faq-${articleId}`}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                              onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById(`faq-${articleId}`);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth' });
                                  // Open accordion
                                  setTimeout(() => {
                                    const trigger = element.querySelector('button');
                                    if (trigger && trigger.getAttribute('data-state') !== 'open') {
                                      trigger.click();
                                    }
                                  }, 500);
                                }
                              }}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{relatedFAQ.question}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <div className="mt-4 pt-4 border-t">
                    {feedback[item.id] ? (
                      <div className="text-sm text-gray-600">
                        {feedback[item.id] === 'helpful' ? (
                          <span className="text-green-600">
                            ✓ Dziękujemy za feedback!
                          </span>
                        ) : (
                          <div>
                            <span className="text-amber-600 mb-2 block">
                              Przykro nam, że nie pomogliśmy. Co możemy poprawić?
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = '#contact'}
                            >
                              Skontaktuj się z nami
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          Czy ten artykuł był pomocny?
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFeedback(item.id, true)}
                            className="flex items-center space-x-1"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>Tak</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFeedback(item.id, false)}
                            className="flex items-center space-x-1"
                          >
                            <ThumbsDown className="w-3 h-3" />
                            <span>Nie</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}

      {/* Still Need Help */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Dalej potrzebujesz pomocy?
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Nasz zespół wsparcia jest gotowy, aby odpowiedzieć na Twoje pytania
        </p>
        <Button onClick={() => window.location.href = '#contact'}>
          Skontaktuj się z supportem
        </Button>
      </div>
    </div>
  );
}

// Category filter component
export function FAQCategoryFilter({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}) {
  const categories = Object.values(FAQ_CATEGORIES);

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange(null)}
      >
        Wszystkie
      </Button>
      {categories.map((category) => {
        const count = FAQ_ITEMS.filter(item => item.category === category).length;
        return (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category)}
          >
            {category} <span className="ml-1 text-xs opacity-70">({count})</span>
          </Button>
        );
      })}
    </div>
  );
}

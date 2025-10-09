'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Video, Book, Wrench } from 'lucide-react';
import Fuse from 'fuse.js';
import type { FuseResultMatch } from 'fuse.js';
import { FAQ_ITEMS, VIDEO_TUTORIALS, API_ENDPOINTS, TROUBLESHOOTING_ISSUES } from '@/lib/help-content';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  section: 'faq' | 'tutorial' | 'api' | 'troubleshooting';
  url: string;
  matches?: readonly FuseResultMatch[];
}

interface HelpSearchProps {
  onResultClick?: (result: SearchResult) => void;
}

export function HelpSearch({ onResultClick }: HelpSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create search index
  const searchIndex = [
    ...FAQ_ITEMS.map(item => ({
      id: item.id,
      title: item.question,
      description: item.answer.substring(0, 200),
      content: item.answer,
      keywords: item.keywords.join(' '),
      section: 'faq' as const,
      url: `#faq-${item.id}`,
    })),
    ...VIDEO_TUTORIALS.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      content: item.summary.join(' '),
      keywords: item.title,
      section: 'tutorial' as const,
      url: `#tutorial-${item.id}`,
    })),
    ...API_ENDPOINTS.map(item => ({
      id: item.path,
      title: `${item.method} ${item.path}`,
      description: item.description,
      content: item.description,
      keywords: item.path,
      section: 'api' as const,
      url: `#api-${item.path.replace(/\//g, '-')}`,
    })),
    ...TROUBLESHOOTING_ISSUES.map(item => ({
      id: item.id,
      title: item.problem,
      description: item.causes.join(', '),
      content: item.solutions.join(' '),
      keywords: item.problem,
      section: 'troubleshooting' as const,
      url: `#troubleshooting-${item.id}`,
    })),
  ];

  const fuse = new Fuse(searchIndex, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'description', weight: 1.5 },
      { name: 'content', weight: 1 },
      { name: 'keywords', weight: 1.5 },
    ],
    threshold: 0.3,
    includeMatches: true,
    minMatchCharLength: 2,
  });

  // Perform search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchResults = fuse.search(query);
    const formattedResults = searchResults.slice(0, 8).map(result => ({
      id: result.item.id,
      title: result.item.title,
      description: result.item.description,
      section: result.item.section,
      url: result.item.url,
      matches: result.matches,
    }));

    setResults(formattedResults);
    setIsOpen(true);
    setSelectedIndex(0);
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');

    if (onResultClick) {
      onResultClick(result);
    } else {
      // Default behavior: scroll to section
      const element = document.querySelector(result.url);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const getSectionIcon = (section: SearchResult['section']) => {
    switch (section) {
      case 'faq':
        return <FileText className="w-4 h-4" />;
      case 'tutorial':
        return <Video className="w-4 h-4" />;
      case 'api':
        return <Book className="w-4 h-4" />;
      case 'troubleshooting':
        return <Wrench className="w-4 h-4" />;
    }
  };

  const getSectionLabel = (section: SearchResult['section']) => {
    switch (section) {
      case 'faq':
        return 'FAQ';
      case 'tutorial':
        return 'Tutorial';
      case 'api':
        return 'API';
      case 'troubleshooting':
        return 'Rozwiązywanie problemów';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Szukaj w dokumentacji..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-12 py-6 text-lg"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border z-50 max-h-[400px] overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2">
              Znaleziono {results.length} wyników
            </div>
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className={`w-full text-left px-3 py-3 rounded-md transition-colors ${
                  index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1 text-gray-400">
                    {getSectionIcon(result.section)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {result.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {getSectionLabel(result.section)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {result.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* No results found message */}
          {query.trim().length >= 2 && results.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Nie znaleziono wyników dla "{query}"
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Spróbuj użyć innych słów kluczowych lub skontaktuj się z naszym zespołem wsparcia
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = '#contact';
                  setIsOpen(false);
                }}
              >
                Skontaktuj się z nami
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500 px-3 py-1 text-right">
          <kbd className="px-2 py-1 bg-gray-100 rounded">↑↓</kbd> nawigacja{' '}
          <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> wybierz{' '}
          <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> zamknij
        </div>
      )}
    </div>
  );
}

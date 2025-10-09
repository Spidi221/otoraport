'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
  language: 'bash' | 'javascript' | 'python' | 'json' | 'xml';
  title?: string;
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languageLabels: Record<typeof language, string> = {
    bash: 'Bash',
    javascript: 'JavaScript',
    python: 'Python',
    json: 'JSON',
    xml: 'XML',
  };

  return (
    <div className="rounded-lg overflow-hidden border bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs text-gray-400 ml-2">
            {title || languageLabels[language]}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-gray-400 hover:text-white h-8"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Skopiowano
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Kopiuj
            </>
          )}
        </Button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-gray-100">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  );
}

// Multi-language code examples
interface CodeExamplesProps {
  examples: {
    curl: string;
    javascript: string;
    python: string;
  };
}

export function CodeExamples({ examples }: CodeExamplesProps) {
  const [activeTab, setActiveTab] = useState<'curl' | 'javascript' | 'python'>('curl');

  const tabs = [
    { id: 'curl' as const, label: 'cURL' },
    { id: 'javascript' as const, label: 'JavaScript' },
    { id: 'python' as const, label: 'Python' },
  ];

  return (
    <div className="space-y-2">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code */}
      <CodeBlock
        code={examples[activeTab]}
        language={activeTab === 'curl' ? 'bash' : activeTab}
      />
    </div>
  );
}

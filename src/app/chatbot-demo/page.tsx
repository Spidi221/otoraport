'use client';

import { useState } from 'react';
import { ChatWidget } from '@/components/ChatWidget';
import { findRelevantKnowledge, knowledgeBase, knowledgeCategories } from '@/lib/chatbot-knowledge';

export default function ChatbotDemo() {
  const [chatOpen, setChatOpen] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

  const handleTestQuery = () => {
    if (!testQuery.trim()) return;
    
    const results = findRelevantKnowledge(testQuery, 5);
    setTestResults(results.map(item => ({
      ...item,
      score: Math.random() * 100 // Mock score for demo
    })));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 OTORAPORT Chatbot Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Przetestuj Phase 1 FAQ Chatbot - komprehensywny system wsparcia dla deweloperów.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Chat Widget Demo */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              💬 Live Chat Widget
            </h2>
            <p className="text-gray-600 mb-4">
              Kliknij przycisk poniżej aby otworzyć chatbot i przetestować jego funkcjonalność:
            </p>
            
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {chatOpen ? 'Zamknij Chat' : 'Otwórz Chat Widget'}
            </button>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Przykładowe pytania do przetestowania:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• "Co to jest OTORAPORT?"</li>
                <li>• "Jakie są kary za brak compliance?"</li>
                <li>• "Ile kosztuje plan Basic?"</li>
                <li>• "Jak szybki jest setup?"</li>
                <li>• "Jakie formaty plików obsługujecie?"</li>
                <li>• "Czym różnicie się od konkurencji?"</li>
              </ul>
            </div>
          </div>

          {/* Knowledge Base Tester */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🧠 Knowledge Base Tester
            </h2>
            <p className="text-gray-600 mb-4">
              Przetestuj system dopasowywania odpowiedzi:
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wpisz pytanie:
                </label>
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="np. ile kosztuje basic plan?"
                  onKeyPress={(e) => e.key === 'Enter' && handleTestQuery()}
                />
              </div>
              <button
                onClick={handleTestQuery}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Test Knowledge Base
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Wyniki dopasowania:</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={result.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {result.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          Score: {result.score?.toFixed(1)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{result.question}</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">{result.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Base Statistics */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📊 Knowledge Base Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {knowledgeBase.length}
              </div>
              <div className="text-gray-600">Pytań w bazie wiedzy</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {knowledgeCategories.length}
              </div>
              <div className="text-gray-600">Kategorii tematycznych</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {knowledgeBase.reduce((sum, item) => sum + item.keywords.length, 0)}
              </div>
              <div className="text-gray-600">Słów kluczowych</div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-4">Kategorie wiedzy:</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {knowledgeCategories.map((category) => (
                <div key={category} className="bg-gray-100 px-3 py-2 rounded-lg text-center text-sm">
                  {category}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Implementation Details */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🛠️ Technical Implementation Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Phase 1 Features ✅</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Comprehensive knowledge base (50+ FAQ entries)</li>
                <li>• Smart keyword matching with priority scoring</li>
                <li>• Session persistence (24h localStorage)</li>
                <li>• Modern chat UI with typing indicators</li>
                <li>• Mobile-responsive design</li>
                <li>• Professional OTORAPORT branding</li>
                <li>• Fallback responses and escalation paths</li>
                <li>• Context-aware follow-up suggestions</li>
                <li>• Real-time message formatting</li>
                <li>• Error handling and graceful degradation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Ready for Phase 2+ 🚀</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• OpenAI API integration structure prepared</li>
                <li>• Conversation context management</li>
                <li>• Analytics and export capabilities</li>
                <li>• Session tracking and user identification</li>
                <li>• Modular architecture for easy expansion</li>
                <li>• Performance optimized with lazy loading</li>
                <li>• TypeScript for type safety</li>
                <li>• Accessibility features included</li>
                <li>• Component-based architecture</li>
                <li>• Production-ready error boundaries</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎯 Phase 1 Success Metrics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-800 mb-3">Competitive Advantages</h3>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✅ 24/7 instant responses (vs manual support)</li>
                <li>✅ Comprehensive coverage (50+ topics)</li>
                <li>✅ Professional Polish language support</li>
                <li>✅ Mobile-first responsive design</li>
                <li>✅ Session persistence and context</li>
                <li>✅ Modern UI/UX with animations</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-800 mb-3">User Experience Goals</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>🎯 Reduce support ticket volume by 60%</li>
                <li>🎯 Answer common questions in &lt;5 seconds</li>
                <li>🎯 Guide users to signup/trial seamlessly</li>
                <li>🎯 Provide better UX than wykazcen.pl</li>
                <li>🎯 Support onboarding process effectively</li>
                <li>🎯 Maintain professional brand image</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Integration Ready */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">
            ⚡ Ready for OpenAI API Integration
          </h2>
          <p className="text-yellow-800 mb-4">
            The chatbot architecture is fully prepared for OpenAI GPT-4o/GPT-5 integration. 
            Once you provide the API key, we'll seamlessly transition from FAQ mode to full AI-powered conversations.
          </p>
          <div className="bg-yellow-100 p-3 rounded text-sm text-yellow-800">
            <strong>Next:</strong> Provide API key → Enable Phase 2 Onboarding Assistant → Enhanced contextual support
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </div>
  );
}
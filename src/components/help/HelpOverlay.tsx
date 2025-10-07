'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, HelpCircle, MessageCircle, BookOpen, Video, ExternalLink, ChevronRight } from 'lucide-react';
import { InAppHelpSystem, HelpContext, HelpResource, ChatbotResponse, GuidedTour } from '@/lib/help-system';

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  context: HelpContext;
  userId: string;
}

export function HelpOverlay({ isOpen, onClose, context, userId }: HelpOverlayProps) {
  const [activeTab, setActiveTab] = useState<'help' | 'chat' | 'tour'>('help');
  const [helpResources, setHelpResources] = useState<HelpResource[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'bot'; message: string; response?: ChatbotResponse }>>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [availableTour, setAvailableTour] = useState<GuidedTour | null>(null);
  const [isLoadingResources, setIsLoadingResources] = useState(true);

  const loadContextualHelp = useCallback(async () => {
    setIsLoadingResources(true);
    try {
      const resources = await InAppHelpSystem.getContextualHelp(context);
      setHelpResources(resources);
    } catch (error) {
      console.error('Error loading contextual help:', error);
    } finally {
      setIsLoadingResources(false);
    }
  }, [context]);

  const checkAvailableTour = useCallback(async () => {
    try {
      const tour = await InAppHelpSystem.getGuidedTour(context);
      setAvailableTour(tour);
    } catch (error) {
      console.error('Error checking available tour:', error);
    }
  }, [context]);

  useEffect(() => {
    if (isOpen) {
      loadContextualHelp();
      checkAvailableTour();
    }
  }, [isOpen, loadContextualHelp, checkAvailableTour]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isLoadingChat) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setIsLoadingChat(true);

    // Add user message to history
    setChatHistory(prev => [...prev, { type: 'user', message: userMessage }]);

    try {
      const response = await InAppHelpSystem.processChatbotQuery(userMessage, context);

      // Add bot response to history
      setChatHistory(prev => [...prev, {
        type: 'bot',
        message: response.message,
        response: response
      }]);

    } catch (error) {
      console.error('Error processing chat query:', error);
      setChatHistory(prev => [...prev, {
        type: 'bot',
        message: 'Przepraszam, wystąpił błąd. Spróbuj ponownie lub skontaktuj się z naszym zespołem wsparcia.'
      }]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleResourceClick = async (resource: HelpResource) => {
    await InAppHelpSystem.trackResourceUsage(resource.id, userId, 'view');

    // Open resource based on type
    if (resource.type === 'video') {
      window.open(`/help/video/${resource.id}`, '_blank');
    } else if (resource.type === 'interactive') {
      window.open(`/help/interactive/${resource.id}`, '_blank');
    } else {
      window.open(`/help/article/${resource.id}`, '_blank');
    }
  };

  interface SuggestedAction {
    action_type: 'link' | 'video' | 'tour' | 'contact_support';
    action_data: {
      url?: string;
      video_id?: string;
      tour_id?: string;
    };
  }

  const handleSuggestedActionClick = (action: SuggestedAction) => {
    switch (action.action_type) {
      case 'link':
        if (action.action_data.url) {
          window.open(action.action_data.url, '_blank');
        }
        break;
      case 'video':
        if (action.action_data.video_id) {
          window.open(`/help/video/${action.action_data.video_id}`, '_blank');
        }
        break;
      case 'tour':
        // Start guided tour
        if (action.action_data.tour_id) {
          startGuidedTour(action.action_data.tour_id);
        }
        break;
      case 'contact_support':
        // Open support form
        openSupportForm(action.action_data.category);
        break;
    }
  };

  const startGuidedTour = (tourId: string) => {
    // Implementation for starting guided tour
    console.log('Starting guided tour:', tourId);
    onClose();
    // In production, this would trigger the guided tour component
  };

  const openSupportForm = (category: string) => {
    // Implementation for opening support form
    console.log('Opening support form for category:', category);
    window.open(`/support/contact?category=${category}`, '_blank');
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'interactive': return <ExternalLink className="w-4 h-4" />;
      case 'article': return <BookOpen className="w-4 h-4" />;
      case 'faq': return <HelpCircle className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Help Panel */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Centrum Pomocy</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('help')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'help'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <HelpCircle className="w-4 h-4 inline mr-1" />
            Pomoc
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'chat'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-1" />
            Chat
          </button>
          {availableTour && (
            <button
              onClick={() => setActiveTab('tour')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'tour'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Przewodnik
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'help' && (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Pomoc dla: {context.page}
                </h3>
                <p className="text-xs text-gray-500">
                  Plan: {context.subscription_plan} • Sekcja: {context.section}
                </p>
              </div>

              {isLoadingResources ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {helpResources.map((resource) => (
                    <div
                      key={resource.id}
                      onClick={() => handleResourceClick(resource)}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getResourceIcon(resource.type)}
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {resource.title}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {resource.content}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(resource.difficulty)}`}>
                              {resource.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">
                              {resource.estimated_read_time} min
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </div>
                  ))}

                  {helpResources.length === 0 && (
                    <div className="text-center py-8">
                      <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Brak specyficznej pomocy dla tej sekcji.
                      </p>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Zapytaj chatbota
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Chat History */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {chatHistory.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-4">
                      Zadaj pytanie, a postaram się pomóc!
                    </p>
                    <div className="text-xs text-gray-400">
                      Przykładowe pytania:
                      <ul className="mt-2 space-y-1">
                        <li>• Jak przesłać dane mieszkań?</li>
                        <li>• Jak skonfigurować raportowanie?</li>
                        <li>• Problem z płatnością</li>
                      </ul>
                    </div>
                  </div>
                )}

                {chatHistory.map((item, index) => (
                  <div key={index} className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      item.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{item.message}</p>

                      {/* Bot response actions */}
                      {item.type === 'bot' && item.response?.suggested_actions && (
                        <div className="mt-3 space-y-2">
                          {item.response.suggested_actions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              onClick={() => handleSuggestedActionClick(action)}
                              className="block w-full text-left text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 transition-colors"
                            >
                              {action.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t">
                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Zadaj pytanie..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoadingChat}
                  />
                  <button
                    type="submit"
                    disabled={!chatMessage.trim() || isLoadingChat}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Wyślij
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'tour' && availableTour && (
            <div className="p-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {availableTour.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Interaktywny przewodnik składający się z {availableTour.steps.length} kroków
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Poziom ukończenia:</strong> {Math.round(availableTour.completion_rate * 100)}% użytkowników kończy ten przewodnik
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {availableTour.steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {step.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {step.description}
                      </p>
                      {step.action_required && (
                        <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Wymagana akcja
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => startGuidedTour(availableTour.id)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Rozpocznij przewodnik
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
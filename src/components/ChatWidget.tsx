'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Send, Minimize2, Maximize2 } from 'lucide-react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatWidgetProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ChatWidget({ isOpen: controlledIsOpen, onToggle }: ChatWidgetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [sessionId] = useState(() => {
    // Generate a unique session ID
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Show greeting when chat first opens
  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0) {
      const greetingMessage: ChatMessage = {
        id: `greeting-${Date.now()}`,
        type: 'bot',
        content: `Cześć! 👋 Jestem asystentem OTO-RAPORT - pomagam **wyłącznie** z automatyzacją raportowania cen mieszkań zgodnie z ustawą z 21 maja 2025.

**Pomagam tylko w tematach:**
• Wymagania prawne i kary za brak compliance
• Plany cenowe (Basic 149zł, Pro 249zł, Enterprise 399zł)  
• Setup i onboarding (<10 min)
• Formaty plików (CSV, XML 1.13, Excel)
• Integracja z dane.gov.pl
• Proces automatyzacji raportowania

**Nie odpowiadam na pytania niezwiązane z OTO-RAPORT.**

Jak mogę pomóc w compliance? 🏢`,
        timestamp: new Date(),
      };
      
      setMessages([greetingMessage]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          conversationHistory: messages,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();
      
      // Handle security blocks
      if (!response.ok) {
        if (response.status === 429 && data.blocked) {
          // Security block - show the security message
          setMessages(prev => {
            const withoutLoading = prev.filter(msg => !msg.isLoading);
            const botMessage: ChatMessage = {
              id: `bot-${Date.now()}`,
              type: 'bot',
              content: data.response || '🛡️ Wiadomość została odrzucona przez system bezpieczeństwa.',
              timestamp: new Date(),
            };
            return [...withoutLoading, botMessage];
          });
          return;
        }
        throw new Error('Failed to get response');
      }

      // Remove loading message and add bot response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: data.response || 'Przepraszam, wystąpił błąd. Spróbuj ponownie lub skontaktuj się z supportem.',
          timestamp: new Date(),
        };
        return [...withoutLoading, botMessage];
      });
    } catch (error) {
      console.error('Chat error:', error);
      // Remove loading message and add error response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          type: 'bot',
          content: 'Przepraszam, wystąpił błąd techniczny. Spróbuj ponownie za chwilę lub skontaktuj się z naszym supportem: support@oto-raport.pl',
          timestamp: new Date(),
        };
        return [...withoutLoading, errorMessage];
      });
    } finally {
      setIsLoading(false);
      // Refocus the input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // Convert markdown-style formatting to JSX
    const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|•[^\n]+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      } else if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      } else if (part.startsWith('•')) {
        return (
          <div key={index} className="flex items-start ml-2 my-1">
            <span className="text-blue-500 mr-2 mt-1">•</span>
            <span>{part.slice(1).trim()}</span>
          </div>
        );
      } else {
        return part.split('\n').map((line, lineIndex, array) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {line}
            {lineIndex < array.length - 1 && <br />}
          </React.Fragment>
        ));
      }
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleToggle}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
          aria-label="Otwórz chat z asystentem OTO-RAPORT"
        >
          <MessageCircle className="w-6 h-6" />
          {/* Notification dot for first-time users */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-sm py-2 px-3 rounded-lg whitespace-nowrap">
              Masz pytanie? Zapytaj asystenta!
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Asystent OTO-RAPORT</h3>
              <div className="flex items-center text-xs text-blue-100">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                <span>Online - zazwyczaj odpowiadamy w 1min</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label={isMinimized ? 'Maximalizuj chat' : 'Minimalizuj chat'}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleToggle}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Zamknij chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-[480px] overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">Myślę...</span>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed">
                        {formatMessageContent(message.content)}
                      </div>
                    )}
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white rounded-b-2xl border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Napisz wiadomość..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Wyślij wiadomość"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500 text-center leading-4 min-h-[16px]">
                <div className="inline-flex items-center justify-center">
                  <span className="mr-1">🤖</span>
                  <span>Zasilane przez AI • Dla złożonych pytań:</span>
                  <a 
                    href="mailto:support@oto-raport.pl" 
                    className="text-blue-600 hover:text-blue-700 ml-1 font-medium underline"
                  >
                    support@oto-raport.pl
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatWidget;
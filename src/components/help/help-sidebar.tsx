'use client';

import { useState, useEffect } from 'react';
import { Rocket, HelpCircle, Video, Book, Wrench, Phone, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpSidebarProps {
  activeSection?: string;
}

const navigationItems = [
  {
    id: 'getting-started',
    label: 'Wprowadzenie',
    icon: Rocket,
    href: '#getting-started',
  },
  {
    id: 'faq',
    label: 'Najczęstsze pytania',
    icon: HelpCircle,
    href: '#faq',
  },
  {
    id: 'tutorials',
    label: 'Tutoriale wideo',
    icon: Video,
    href: '#tutorials',
  },
  {
    id: 'api-docs',
    label: 'Dokumentacja API',
    icon: Book,
    href: '#api-docs',
    badge: 'Enterprise',
  },
  {
    id: 'troubleshooting',
    label: 'Rozwiązywanie problemów',
    icon: Wrench,
    href: '#troubleshooting',
  },
  {
    id: 'contact',
    label: 'Kontakt',
    icon: Phone,
    href: '#contact',
  },
];

export function HelpSidebar({ activeSection }: HelpSidebarProps) {
  const [active, setActive] = useState(activeSection || 'getting-started');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = navigationItems.map(item => item.id);
      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActive(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string, href: string) => {
    setActive(id);
    setIsMobileOpen(false);

    // Smooth scroll to section
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-20 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
          <span className="ml-2">Menu</span>
        </Button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-white border-r z-30
          transition-transform duration-200 overflow-y-auto
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.href)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Links */}
        <div className="border-t p-4 mt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Szybkie linki
          </h4>
          <div className="space-y-2">
            <a
              href="/dashboard"
              className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/dashboard/settings"
              className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Ustawienia
            </a>
            <a
              href="mailto:support@otoraport.pl"
              className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Email support
            </a>
          </div>
        </div>

        {/* Help CTA */}
        <div className="border-t p-4 mt-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Potrzebujesz pomocy?
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Nasz zespół jest gotowy, aby Ci pomóc
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => handleNavClick('contact', '#contact')}
            >
              Skontaktuj się
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

'use client'

import { useSession } from "next-auth/react";
import { Suspense, lazy, useMemo } from "react";
import { Header } from "@/components/dashboard/header";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { StatusCards } from "@/components/dashboard/status-cards";
import { LoadingState } from "@/components/ui/loading";
import ScrollToTop from "@/components/ScrollToTop";
import { ChatWidget } from "@/components/ChatWidget";

// Lazy load heavy components that are below the fold
const ActionButtons = lazy(() => import("@/components/dashboard/action-buttons").then(m => ({ default: m.ActionButtons })));
const ChartsSection = lazy(() => import("@/components/dashboard/charts-section").then(m => ({ default: m.ChartsSection })));
const PropertiesTable = lazy(() => import("@/components/dashboard/properties-table").then(m => ({ default: m.PropertiesTable })));

export default function HomePage() {
  const { data: session } = useSession();
  
  // Memoized greeting calculation - avoiding SSR/CSR mismatch
  const greeting = useMemo(() => {
    if (!session?.user?.name) {
      return "Dzień dobry! 👋";
    }
    
    const firstName = session.user.name.split(' ')[0];
    
    // Use static greeting to avoid hydration mismatch
    const greetingText = "Dzień dobry";
    
    return `${greetingText}, ${firstName}! 👋`;
  }, [session?.user?.name]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserMenu={!!session} />
      
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 lg:px-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {greeting}
          </h1>
          <p className="text-muted-foreground">
            {session ? 
              "Wszystko działa sprawnie. Twoje raporty są aktualne i zgodne z przepisami." :
              "Zaloguj się, aby zarządzać swoimi raportami nieruchomości."
            }
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="space-y-6">
          {/* Top Row - Upload Widget and Status Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            <UploadWidget />
            <div className="lg:col-span-4 grid grid-cols-2 gap-6">
              <StatusCards />
            </div>
          </div>

          {/* Action Buttons */}
          <Suspense fallback={<LoadingState message="Ładowanie akcji..." />}>
            <ActionButtons />
          </Suspense>

          {/* Charts Section */}
          <Suspense fallback={<LoadingState message="Ładowanie wykresów..." />}>
            <ChartsSection />
          </Suspense>

          {/* Properties Table */}
          <Suspense fallback={<LoadingState message="Ładowanie tabeli nieruchomości..." />}>
            <PropertiesTable />
          </Suspense>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 OTORAPORT. Automatyzacja raportowania cen nieruchomości.
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Pomoc
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Dokumentacja API
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Kontakt
              </a>
            </div>
          </div>
        </footer>
        
        <ScrollToTop />
        <ChatWidget />
      </main>
    </div>
  );
}

'use client'

import { Suspense, lazy, useMemo } from "react";
import { useAuthSimple as useAuth } from "@/hooks/use-auth-simple";
import { Header } from "@/components/dashboard/header";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { LoadingState } from "@/components/ui/loading";
import ScrollToTop from "@/components/ScrollToTop";
import { ChatWidget } from "@/components/ChatWidget";

// Lazy load heavy components that are below the fold
const ActionButtons = lazy(() => import("@/components/dashboard/action-buttons").then(m => ({ default: m.ActionButtons })));
const PropertiesTable = lazy(() => import("@/components/dashboard/properties-table").then(m => ({ default: m.PropertiesTable })));
const PricingCard = lazy(() => import("@/components/dashboard/pricing-card").then(m => ({ default: m.PricingCard })));

export default function HomePage() {
  // Use unified auth hook
  const { user } = useAuth();

  // Memoized greeting calculation - avoiding SSR/CSR mismatch
  const greeting = useMemo(() => {
    if (!user?.user_metadata?.full_name) {
      return "Dzień dobry! 👋";
    }
    
    const firstName = user.user_metadata.full_name.split(' ')[0];
    
    // Use static greeting to avoid hydration mismatch
    const greetingText = "Dzień dobry";
    
    return `${greetingText}, ${firstName}! 👋`;
  }, [user?.user_metadata?.full_name]);

  // Middleware already verified auth - no need to block rendering
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserMenu={!!user} />
      
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 lg:px-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {greeting}
          </h1>
          <p className="text-muted-foreground">
            {user ? 
              "Wszystko działa sprawnie. Twoje raporty są aktualne i zgodne z przepisami." :
              "Zaloguj się, aby zarządzać swoimi raportami nieruchomości."
            }
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="space-y-6">
          {/* Upload Widget */}
          <UploadWidget />

          {/* Ministry Endpoint Links */}
          <Suspense fallback={<LoadingState message="Ładowanie..." />}>
            <ActionButtons />
          </Suspense>

          {/* Properties Table */}
          <Suspense fallback={<LoadingState message="Ładowanie tabeli nieruchomości..." />}>
            <PropertiesTable />
          </Suspense>

          {/* Subscription Info */}
          <Suspense fallback={<LoadingState message="Ładowanie..." />}>
            <PricingCard />
          </Suspense>
        </div>


        <ScrollToTop />
        <ChatWidget />
      </main>
    </div>
  );
}

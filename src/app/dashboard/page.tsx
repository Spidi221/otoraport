'use client'

import { Suspense, lazy, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/dashboard/header";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { StatusCards } from "@/components/dashboard/status-cards";
import { LoadingState } from "@/components/ui/loading";
import ScrollToTop from "@/components/ScrollToTop";
import { ChatWidget } from "@/components/ChatWidget";
import { FloatingHelpButton } from "@/components/help/HelpButton";

// Lazy load heavy components that are below the fold
const ActionButtons = lazy(() => import("@/components/dashboard/action-buttons").then(m => ({ default: m.ActionButtons })));
const ChartsSection = lazy(() => import("@/components/dashboard/charts-section").then(m => ({ default: m.ChartsSection })));
const PropertiesTable = lazy(() => import("@/components/dashboard/properties-table").then(m => ({ default: m.PropertiesTable })));
const PresentationSection = lazy(() => import("@/components/dashboard/presentation-section").then(m => ({ default: m.PresentationSection })));
const AdvancedAnalyticsDashboard = lazy(() => import("@/components/dashboard/AdvancedAnalyticsDashboard"));
const PredictiveInsightsDashboard = lazy(() => import("@/components/dashboard/PredictiveInsightsDashboard"));

export default function HomePage() {
  // FIXED: Use unified auth hook with automatic developer profile loading
  const { user, developer, loading, isAdmin } = useAuth();

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

  // Show loading while checking user status
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="Sprawdzanie uprawnień..." />
      </div>
    );
  }

  // Show access denied if not properly authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dostęp zabroniony</h2>
          <p className="text-gray-600 mb-6">Musisz się zalogować, aby uzyskać dostęp do dashboardu.</p>
        </div>
      </div>
    );
  }

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

          {/* Advanced Analytics Dashboard */}
          <Suspense fallback={<LoadingState message="Ładowanie zaawansowanych analiz..." />}>
            <AdvancedAnalyticsDashboard />
          </Suspense>

          {/* Predictive Insights Dashboard */}
          <Suspense fallback={<LoadingState message="Ładowanie AI insights..." />}>
            <PredictiveInsightsDashboard />
          </Suspense>

          {/* Presentation Section */}
          <Suspense fallback={<LoadingState message="Ładowanie sekcji prezentacyjnej..." />}>
            <PresentationSection />
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


        <ScrollToTop />
        <ChatWidget />

        {/* Floating Help Button */}
        {user && (
          <FloatingHelpButton
            userId={user.id}
            subscriptionPlan={developer?.subscription_plan || 'basic'}
            onboardingStep={1}
          />
        )}
      </main>
    </div>
  );
}

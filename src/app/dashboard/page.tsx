'use client'

import { Suspense, lazy, useMemo } from "react";
import { useAuthSimple as useAuth } from "@/hooks/use-auth-simple";
import { useGA4SubscriptionTracking } from "@/hooks/use-ga4-subscription-tracking";
import { Header } from "@/components/dashboard/header";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { LoadingState } from "@/components/ui/loading";
import ScrollToTop from "@/components/ScrollToTop";
import TrialBanner from "@/components/dashboard/trial-banner";

// Lazy load heavy components that are below the fold
const ActionButtons = lazy(() => import("@/components/dashboard/action-buttons").then(m => ({ default: m.ActionButtons })));
const PropertiesTable = lazy(() => import("@/components/dashboard/properties-table").then(m => ({ default: m.PropertiesTable })));
const ChatWidget = lazy(() => import("@/components/ChatWidget").then(m => ({ default: m.ChatWidget })));
const StatisticsCards = lazy(() => import("@/components/dashboard/statistics-cards").then(m => ({ default: m.StatisticsCards })));

export default function HomePage() {
  // Use unified auth hook
  const { user, developer } = useAuth();

  // Track subscription events in GA4 (trial start, conversion)
  useGA4SubscriptionTracking({
    userId: user?.id,
    subscriptionStatus: developer?.subscription_status,
    subscriptionPlan: developer?.subscription_plan,
    trialStatus: (developer as any)?.trial_status,
    trialEndsAt: (developer as any)?.trial_ends_at,
  });

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

        {/* Trial Banner - only show for trial users */}
        {developer && (
          <TrialBanner
            subscriptionStatus={developer.subscription_status}
            trialEndsAt={(developer as any).trial_ends_at || null}
            trialStatus={(developer as any).trial_status || null}
          />
        )}

        {/* Dashboard Grid */}
        <div className="space-y-6">
          {/* Statistics Cards */}
          <Suspense fallback={<LoadingState message="Ładowanie statystyk..." />}>
            <StatisticsCards />
          </Suspense>

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
        </div>


        <ScrollToTop />

        {/* Chat Widget - lazy loaded */}
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      </main>
    </div>
  );
}

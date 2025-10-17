'use client'

import { Suspense, lazy, useMemo, useState, useEffect } from "react";
import { useAuthSimple as useAuth } from "@/hooks/use-auth-simple";
import { useGA4SubscriptionTracking } from "@/hooks/use-ga4-subscription-tracking";
import { Header } from "@/components/dashboard/header";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { LoadingState } from "@/components/ui/loading";
import ScrollToTop from "@/components/ScrollToTop";
import TrialBanner from "@/components/dashboard/trial-banner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Lazy load heavy components that are below the fold
const ActionButtons = lazy(() => import("@/components/dashboard/action-buttons").then(m => ({ default: m.ActionButtons })));
const ProjectsList = lazy(() => import("@/components/dashboard/projects-list").then(m => ({ default: m.ProjectsList })));
const PropertiesTable = lazy(() => import("@/components/dashboard/properties-table").then(m => ({ default: m.PropertiesTable })));
const ChatWidget = lazy(() => import("@/components/ChatWidget").then(m => ({ default: m.ChatWidget })));
const StatisticsCards = lazy(() => import("@/components/dashboard/statistics-cards").then(m => ({ default: m.StatisticsCards })));
const DataQualityWidget = lazy(() => import("@/components/dashboard/data-quality-widget").then(m => ({ default: m.DataQualityWidget })));
const DataCompletionWizard = lazy(() => import("@/components/wizard/data-completion-wizard").then(m => ({ default: m.DataCompletionWizard })));

export default function HomePage() {
  // Use unified auth hook
  const { user, developer } = useAuth();

  // Data Completion Wizard state (Task #106.2)
  const [showWizard, setShowWizard] = useState(false);

  // Listen for wizard open event from Header badge (Task #106.3)
  useEffect(() => {
    const handleOpenWizard = () => setShowWizard(true);
    window.addEventListener('open-data-completion-wizard', handleOpenWizard);
    return () => window.removeEventListener('open-data-completion-wizard', handleOpenWizard);
  }, []);

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

          {/* Data Quality Widget */}
          <Suspense fallback={<LoadingState message="Ładowanie walidacji..." />}>
            <DataQualityWidget />
          </Suspense>

          {/* Upload Widget - Task #104: Pass developer ID for feedback modal */}
          <UploadWidget
            developerId={developer?.id}
            onStartDataCompletion={() => setShowWizard(true)}
          />

          {/* Projects/Files List */}
          <Suspense fallback={<LoadingState message="Ładowanie projektów..." />}>
            <ProjectsList />
          </Suspense>

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

        {/* Data Completion Wizard - Task #106.2 */}
        {developer?.id && (
          <Dialog open={showWizard} onOpenChange={setShowWizard}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Uzupełnij dane firmy</DialogTitle>
              </DialogHeader>
              <Suspense fallback={<LoadingState message="Ładowanie wizarda..." />}>
                <DataCompletionWizard
                  developerId={developer.id}
                  onComplete={() => setShowWizard(false)}
                />
              </Suspense>
            </DialogContent>
          </Dialog>
        )}

        {/* Chat Widget - lazy loaded */}
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      </main>
    </div>
  );
}

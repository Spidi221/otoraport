'use client'

import { useSession } from "next-auth/react";
import { Suspense, lazy, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
const PresentationSection = lazy(() => import("@/components/dashboard/presentation-section").then(m => ({ default: m.PresentationSection })));

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check user profile and subscription status
  useEffect(() => {
    async function checkUserStatus() {
      if (status === 'loading') return;
      
      if (status === 'unauthenticated') {
        router.push('/auth/signin');
        return;
      }

      if (session?.user?.email) {
        try {
          // Check if user has completed profile
          const response = await fetch('/api/user/profile');
          const data = await response.json();
          
          if (!response.ok || !data.profile_completed) {
            // User logged in via Google but hasn't completed registration
            router.push('/onboarding?reason=incomplete_profile');
            return;
          }
          
          setUserProfile(data);
        } catch (error) {
          console.error('Error checking user status:', error);
          // If there's an error, redirect to onboarding to be safe
          router.push('/onboarding?reason=profile_check_failed');
          return;
        }
      }
      
      setIsLoading(false);
    }

    checkUserStatus();
  }, [session, status, router]);

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

  // Show loading while checking user status
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="Sprawdzanie uprawnień..." />
      </div>
    );
  }

  // Show access denied if not properly authenticated
  if (!session || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dostęp zabroniony</h2>
          <p className="text-gray-600 mb-6">Musisz ukończyć proces rejestracji, aby uzyskać dostęp do dashboardu.</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Ukończ rejestrację
          </button>
        </div>
      </div>
    );
  }

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
      </main>
    </div>
  );
}

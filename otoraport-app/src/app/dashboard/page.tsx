'use client'

import { Suspense, lazy, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check Supabase user and profile status
  useEffect(() => {
    async function checkUserStatus() {
      console.log('Dashboard: Checking auth status...')
      
      // Get current Supabase session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Dashboard: Auth error:', error)
        router.push('/auth/signin')
        return
      }
      
      if (!session?.user) {
        console.log('Dashboard: No session, redirecting to signin')
        router.push('/auth/signin')
        return
      }
      
      console.log('Dashboard: User authenticated:', session.user.email)
      setUser(session.user)

      if (session.user?.email) {
        console.log('Dashboard: User authenticated, skipping profile API check')
        // TODO: Replace with direct Supabase query to developers table
        // For now, assume user is good to go
      }
      
      setIsLoading(false);
    }

    checkUserStatus();
  }, [router]);

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
  if (isLoading) {
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

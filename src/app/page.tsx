'use client'

import { Header } from "@/components/dashboard/header";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { StatusCards } from "@/components/dashboard/status-cards";
import { ActionButtons } from "@/components/dashboard/action-buttons";
import { ChartsSection } from "@/components/dashboard/charts-section";
import { PropertiesTable } from "@/components/dashboard/properties-table";
import ScrollToTop from "@/components/ScrollToTop";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserMenu={false} />
      
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 lg:px-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Dzień dobry, Jan! 👋
          </h1>
          <p className="text-muted-foreground">
            Wszystko działa sprawnie. Twoje raporty są aktualne i zgodne z przepisami.
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
          <ActionButtons />

          {/* Charts Section */}
          <ChartsSection />

          {/* Properties Table */}
          <PropertiesTable />
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
      </main>
    </div>
  );
}

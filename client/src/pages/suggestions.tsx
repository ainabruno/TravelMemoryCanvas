import React from "react";
import AppHeader from "@/components/app-header";
import MobileNav from "@/components/mobile-nav";
import LocationSuggestions from "@/components/location-suggestions";

export default function SuggestionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LocationSuggestions />
      </main>

      <MobileNav />
    </div>
  );
}
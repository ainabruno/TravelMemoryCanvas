import React from "react";
import PageLayout from "@/components/page-layout";
import SimpleLocationSuggestions from "@/components/simple-location-suggestions";

export default function SuggestionsPage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Suggestions Intelligentes</h1>
            <p className="text-gray-600">Découvrez de nouvelles destinations personnalisées</p>
          </div>
          <SimpleLocationSuggestions />
        </div>
      </div>
    </PageLayout>
  );
}
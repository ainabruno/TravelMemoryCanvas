import React from "react";
import { EnhancedMapView } from "@/components/enhanced-map-view";
import PageLayout from "@/components/page-layout";

export default function EnhancedMaps() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Carte Interactive</h1>
            <p className="text-gray-600">Explorez vos voyages sur une carte interactive</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <EnhancedMapView />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
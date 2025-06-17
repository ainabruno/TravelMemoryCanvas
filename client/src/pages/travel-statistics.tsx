import TravelStatistics from "@/components/travel-statistics";
import PageLayout from "@/components/page-layout";

export default function TravelStatisticsPage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TravelStatistics />
        </div>
      </div>
    </PageLayout>
  );
}
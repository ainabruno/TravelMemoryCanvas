import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import MentoringSystem from "@/components/mentoring-system";
import PageLayout from "@/components/page-layout";

export default function MentoringPage() {
  const [, setLocation] = useLocation();

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au menu
            </Button>
          </div>
          <MentoringSystem />
        </div>
      </div>
    </PageLayout>
  );
}
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import AlbumsPage from "@/pages/albums";
import AIAnalysisPage from "@/pages/ai-analysis";
import SuggestionsPage from "@/pages/suggestions";
import StoryGenerationPage from "@/pages/story-generation";
import FaceDetectionPage from "@/pages/face-detection";
import PhotoBooksPage from "@/pages/photo-books";
import VideoGenerationPage from "@/pages/video-generation";
import EnhancedMaps from "@/pages/enhanced-maps";
import SocialImportPage from "@/pages/social-import";
import TravelStatisticsPage from "@/pages/travel-statistics";
import TravelGroupsPage from "@/pages/travel-groups";
import MentoringPage from "@/pages/mentoring";
import GranularSharingPage from "@/pages/granular-sharing";
import IntelligentAnonymizationPage from "@/pages/intelligent-anonymization";
import Subscription from "@/pages/subscription";
import Marketplace from "@/pages/marketplace";
import Affiliate from "@/pages/affiliate";
import RevenueAnalytics from "@/pages/revenue-analytics-fr";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/albums" component={AlbumsPage} />
      <Route path="/ai-analysis" component={AIAnalysisPage} />
      <Route path="/suggestions" component={SuggestionsPage} />
      <Route path="/stories" component={StoryGenerationPage} />
      <Route path="/faces" component={FaceDetectionPage} />
      <Route path="/photo-books" component={PhotoBooksPage} />
      <Route path="/videos" component={VideoGenerationPage} />
      <Route path="/enhanced-maps" component={EnhancedMaps} />
      <Route path="/social-import" component={SocialImportPage} />
      <Route path="/statistics" component={TravelStatisticsPage} />
      <Route path="/groups" component={TravelGroupsPage} />
      <Route path="/mentoring" component={MentoringPage} />
      <Route path="/sharing" component={GranularSharingPage} />
      <Route path="/anonymization" component={IntelligentAnonymizationPage} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/affiliate" component={Affiliate} />
      <Route path="/admin/revenue" component={RevenueAnalytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

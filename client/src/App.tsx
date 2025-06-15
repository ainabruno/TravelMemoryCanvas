import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import AIAnalysisPage from "@/pages/ai-analysis";
import SuggestionsPage from "@/pages/suggestions";
import StoryGenerationPage from "@/pages/story-generation";
import FaceDetectionPage from "@/pages/face-detection";
import PhotoBooksPage from "@/pages/photo-books";
import VideoGenerationPage from "@/pages/video-generation";
import EnhancedMaps from "@/pages/enhanced-maps";
import SocialImportPage from "@/pages/social-import";
import TravelStatisticsPage from "@/pages/travel-statistics";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ai-analysis" component={AIAnalysisPage} />
      <Route path="/suggestions" component={SuggestionsPage} />
      <Route path="/stories" component={StoryGenerationPage} />
      <Route path="/faces" component={FaceDetectionPage} />
      <Route path="/photo-books" component={PhotoBooksPage} />
      <Route path="/videos" component={VideoGenerationPage} />
      <Route path="/enhanced-maps" component={EnhancedMaps} />
      <Route path="/social-import" component={SocialImportPage} />
      <Route path="/statistics" component={TravelStatisticsPage} />
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

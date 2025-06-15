import { Camera, Plus, User, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/notification-center";

export default function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Camera className="text-adventure-blue text-2xl" />
              <h1 className="text-xl font-bold text-slate-900">Wanderlust</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="/" className="text-adventure-blue font-medium">My Trips</a>
              <a href="#" className="text-slate-600 hover:text-adventure-blue transition-colors">Albums</a>
              <a href="/ai-analysis" className="text-slate-600 hover:text-adventure-blue transition-colors flex items-center gap-1">
                <Brain className="w-4 h-4" />
                IA Analysis
              </a>
              <a href="#" className="text-slate-600 hover:text-adventure-blue transition-colors">Search</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationCenter contributorName="Utilisateur" />
            <Button className="bg-adventure-blue text-white hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Trip
            </Button>
            <div className="w-8 h-8 bg-sunset-orange rounded-full flex items-center justify-center">
              <User className="text-white text-sm" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

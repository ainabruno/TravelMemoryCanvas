import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Camera, 
  Plus, 
  User, 
  ChevronDown,
  Home,
  Upload,
  Images,
  Map,
  Users,
  Brain,
  Sparkles,
  BookOpen,
  Video,
  BarChart3,
  Share2,
  Settings,
  Crown,
  ShoppingBag,
  DollarSign,
  Shield,
  Download,
  ScanFace,
  GraduationCap,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationCenter from "@/components/notification-center";

export default function NavigationMenu() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const menuCategories = [
    {
      label: "Mes Voyages",
      icon: Camera,
      items: [
        { label: "Accueil", path: "/", icon: Home },
        { label: "Albums", path: "/albums", icon: Images },
        { label: "Cartes", path: "/enhanced-maps", icon: Map },
        { label: "Statistiques", path: "/statistics", icon: BarChart3 }
      ]
    },
    {
      label: "IA & Création",
      icon: Brain,
      items: [
        { label: "Analyse IA", path: "/ai-analysis", icon: Brain },
        { label: "Suggestions", path: "/suggestions", icon: Sparkles },
        { label: "Génération de récits", path: "/stories", icon: BookOpen },
        { label: "Création de vidéos", path: "/videos", icon: Video },
        { label: "Livres photo", path: "/photo-books", icon: BookOpen },
        { label: "Détection de visages", path: "/faces", icon: ScanFace }
      ]
    },
    {
      label: "Social & Partage",
      icon: Users,
      items: [
        { label: "Groupes de voyage", path: "/groups", icon: Users },
        { label: "Partage granulaire", path: "/sharing", icon: Share2 },
        { label: "Import réseaux sociaux", path: "/social-import", icon: Download },
        { label: "Mentorat", path: "/mentoring", icon: GraduationCap }
      ]
    },
    {
      label: "Confidentialité",
      icon: Shield,
      items: [
        { label: "Anonymisation intelligente", path: "/anonymization", icon: Shield }
      ]
    },
    {
      label: "Premium & Business",
      icon: Crown,
      items: [
        { label: "Plans Premium", path: "/subscription", icon: Crown },
        { label: "Marketplace", path: "/marketplace", icon: ShoppingBag },
        { label: "Programme d'affiliation", path: "/affiliate", icon: DollarSign },
        { label: "Analyses de revenus", path: "/admin/revenue", icon: BarChart3 }
      ]
    }
  ];

  const MobileMenuItem = ({ item, onClick }: { item: any; onClick: () => void }) => (
    <Link href={item.path}>
      <div 
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive(item.path) 
            ? 'bg-blue-50 text-blue-700 font-medium' 
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        onClick={onClick}
      >
        <item.icon className="w-5 h-5" />
        <span>{item.label}</span>
      </div>
    </Link>
  );

  const DesktopDropdown = ({ category }: { category: any }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
            category.items.some((item: any) => isActive(item.path))
              ? 'text-blue-700 bg-blue-50'
              : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <category.icon className="w-4 h-4" />
          {category.label}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wide">
          {category.label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {category.items.map((item: any) => (
          <DropdownMenuItem key={item.path} asChild>
            <Link href={item.path}>
              <div className={`flex items-center gap-3 w-full ${
                isActive(item.path) ? 'text-blue-700 font-medium' : ''
              }`}>
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Wanderlust</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Vos souvenirs magnifiés</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            {/* Accueil direct */}
            <Link href="/">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-blue-700 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <Home className="w-4 h-4" />
                Accueil
              </Button>
            </Link>

            {/* Menus déroulants par catégorie */}
            {menuCategories.map((category) => (
              <DesktopDropdown key={category.label} category={category} />
            ))}
          </nav>

          {/* Actions et profil */}
          <div className="flex items-center space-x-3">
            <NotificationCenter contributorName="Utilisateur" />
            
            {/* Bouton d'action rapide */}
            <Button className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau voyage
            </Button>

            {/* Menu utilisateur */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-10 h-10 rounded-full p-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu mobile */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* En-tête mobile */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-900">Wanderlust</h2>
                        <p className="text-xs text-gray-500">Menu de navigation</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Navigation mobile */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-6">
                      {/* Accueil en premier */}
                      <div>
                        <MobileMenuItem 
                          item={{ label: "Accueil", path: "/", icon: Home }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        />
                      </div>

                      {/* Catégories */}
                      {menuCategories.map((category) => (
                        <div key={category.label}>
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                            <category.icon className="w-4 h-4" />
                            {category.label}
                          </h3>
                          <div className="space-y-1 ml-6">
                            {category.items.map((item) => (
                              <MobileMenuItem 
                                key={item.path}
                                item={item}
                                onClick={() => setIsMobileMenuOpen(false)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions rapides mobile */}
                  <div className="p-4 border-t bg-gray-50">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau voyage
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
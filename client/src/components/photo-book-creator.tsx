import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Image as ImageIcon, 
  Layout,
  Palette,
  Download,
  Share,
  Settings,
  Wand2,
  Eye,
  Edit,
  Plus,
  Trash2,
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Type,
  Calendar,
  MapPin,
  Heart,
  Star,
  Camera,
  Users,
  Save,
  RefreshCw,
  Copy,
  Grid,
  Layers
} from "lucide-react";

interface PhotoBookCreatorProps {
  tripId?: number;
  albumId?: number;
  className?: string;
}

interface PhotoBookPage {
  id: string;
  pageNumber: number;
  layout: 'single' | 'double' | 'grid' | 'collage' | 'story';
  background: string;
  elements: PageElement[];
}

interface PageElement {
  id: string;
  type: 'photo' | 'text' | 'shape' | 'map';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  data: any;
  style: ElementStyle;
}

interface ElementStyle {
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadow: boolean;
  opacity: number;
  filter?: string;
}

interface PhotoBook {
  id: string;
  title: string;
  subtitle?: string;
  tripId?: number;
  albumId?: number;
  coverImage?: string;
  format: 'square' | 'landscape' | 'portrait';
  size: 'small' | 'medium' | 'large';
  theme: string;
  pages: PhotoBookPage[];
  totalPages: number;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  printReady: boolean;
}

interface BookTheme {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layouts: string[];
}

const bookThemes: BookTheme[] = [
  {
    id: 'adventure',
    name: 'Aventure',
    description: 'Parfait pour les voyages d\'aventure et la nature',
    preview: 'bg-gradient-to-br from-green-100 to-blue-100',
    colors: {
      primary: '#16a34a',
      secondary: '#0284c7',
      accent: '#f59e0b',
      background: '#f8fafc',
      text: '#1e293b'
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Open Sans'
    },
    layouts: ['single', 'double', 'grid', 'collage']
  },
  {
    id: 'romantic',
    name: 'Romantique',
    description: 'Idéal pour les voyages en couple et lunes de miel',
    preview: 'bg-gradient-to-br from-pink-100 to-purple-100',
    colors: {
      primary: '#ec4899',
      secondary: '#a855f7',
      accent: '#f97316',
      background: '#fdf2f8',
      text: '#701a75'
    },
    fonts: {
      heading: 'Dancing Script',
      body: 'Lora'
    },
    layouts: ['single', 'double', 'story']
  },
  {
    id: 'minimal',
    name: 'Minimaliste',
    description: 'Design épuré et moderne',
    preview: 'bg-gradient-to-br from-gray-100 to-slate-100',
    colors: {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#059669',
      background: '#ffffff',
      text: '#111827'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    layouts: ['single', 'grid']
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Style rétro et authentique',
    preview: 'bg-gradient-to-br from-amber-100 to-orange-100',
    colors: {
      primary: '#d97706',
      secondary: '#92400e',
      accent: '#dc2626',
      background: '#fef3c7',
      text: '#451a03'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Crimson Text'
    },
    layouts: ['story', 'collage', 'single']
  }
];

const pageLayouts = [
  { id: 'single', name: 'Photo unique', icon: ImageIcon, description: 'Une grande photo par page' },
  { id: 'double', name: 'Deux photos', icon: Grid, description: 'Deux photos côte à côte' },
  { id: 'grid', name: 'Grille', icon: Layout, description: 'Grille de 4-6 photos' },
  { id: 'collage', name: 'Collage', icon: Layers, description: 'Photos superposées artistiquement' },
  { id: 'story', name: 'Histoire', icon: Type, description: 'Photos avec texte narratif' }
];

export default function PhotoBookCreator({ tripId, albumId, className = "" }: PhotoBookCreatorProps) {
  const [selectedBook, setSelectedBook] = useState<PhotoBook | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<BookTheme>(bookThemes[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookSubtitle, setBookSubtitle] = useState('');
  const [bookFormat, setBookFormat] = useState<'square' | 'landscape' | 'portrait'>('landscape');
  const [bookSize, setBookSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [autoLayout, setAutoLayout] = useState(true);
  const [includeMap, setIncludeMap] = useState(true);
  const [includeStory, setIncludeStory] = useState(false);
  const [selectedElement, setSelectedElement] = useState<PageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch trip/album data
  const { data: tripData } = useQuery({
    queryKey: tripId ? ['/api/trips', tripId] : ['/api/albums', albumId],
    queryFn: () => {
      const endpoint = tripId ? `/api/trips/${tripId}` : `/api/albums/${albumId}`;
      return apiRequest('GET', endpoint).then(res => res.json());
    },
    enabled: !!(tripId || albumId)
  });

  // Fetch photos for the book
  const { data: photos = [] } = useQuery({
    queryKey: tripId ? ['/api/photos/trip', tripId] : ['/api/photos/album', albumId],
    queryFn: () => {
      const endpoint = tripId ? `/api/photos/trip/${tripId}` : `/api/photos/album/${albumId}`;
      return apiRequest('GET', endpoint).then(res => res.json());
    },
    enabled: !!(tripId || albumId)
  });

  // Fetch existing photo books
  const { data: existingBooks = [] } = useQuery({
    queryKey: ['/api/photo-books', tripId || albumId],
    queryFn: () => {
      const params = tripId ? `tripId=${tripId}` : `albumId=${albumId}`;
      return apiRequest('GET', `/api/photo-books?${params}`).then(res => res.json());
    },
    enabled: !!(tripId || albumId)
  });

  // Create photo book mutation
  const createBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      setIsCreating(true);
      setCreationProgress(0);

      // Simulate creation progress
      const progressInterval = setInterval(() => {
        setCreationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 800);

      const response = await apiRequest('POST', '/api/photo-books/create', bookData);
      
      clearInterval(progressInterval);
      setCreationProgress(100);

      return response.json();
    },
    onSuccess: (book: PhotoBook) => {
      setIsCreating(false);
      setCreationProgress(0);
      setSelectedBook(book);
      queryClient.invalidateQueries({ queryKey: ['/api/photo-books'] });
      
      toast({
        title: "Livre photo créé",
        description: `${book.totalPages} pages générées automatiquement`,
      });
    },
    onError: () => {
      setIsCreating(false);
      setCreationProgress(0);
      toast({
        title: "Erreur de création",
        description: "Impossible de créer le livre photo",
        variant: "destructive",
      });
    },
  });

  // Save book mutation
  const saveBookMutation = useMutation({
    mutationFn: async (book: PhotoBook) => {
      const response = await apiRequest('PUT', `/api/photo-books/${book.id}`, book);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photo-books'] });
      toast({
        title: "Livre sauvegardé",
        description: "Vos modifications ont été enregistrées",
      });
    },
  });

  // Generate layouts mutation
  const generateLayoutsMutation = useMutation({
    mutationFn: async (data: { photos: any[], theme: BookTheme, settings: any }) => {
      const response = await apiRequest('POST', '/api/photo-books/generate-layouts', data);
      return response.json();
    },
    onSuccess: (layouts) => {
      toast({
        title: "Mises en page générées",
        description: `${layouts.length} pages créées automatiquement`,
      });
    },
  });

  const handleCreateBook = () => {
    if (!tripData && !photos.length) {
      toast({
        title: "Données insuffisantes",
        description: "Sélectionnez un voyage ou un album avec des photos",
        variant: "destructive",
      });
      return;
    }

    const bookData = {
      title: bookTitle || tripData?.title || 'Mon voyage',
      subtitle: bookSubtitle,
      tripId,
      albumId,
      format: bookFormat,
      size: bookSize,
      theme: selectedTheme.id,
      photos: photos.slice(0, 50), // Limit for demo
      settings: {
        autoLayout,
        includeMap,
        includeStory,
      }
    };

    createBookMutation.mutate(bookData);
  };

  const handleSaveBook = () => {
    if (selectedBook) {
      saveBookMutation.mutate(selectedBook);
    }
  };

  const handleThemeChange = (theme: BookTheme) => {
    setSelectedTheme(theme);
    if (selectedBook) {
      setSelectedBook({
        ...selectedBook,
        theme: theme.id
      });
    }
  };

  const handleAddElement = (type: PageElement['type'], data: any) => {
    if (!selectedBook) return;

    const newElement: PageElement = {
      id: `element_${Date.now()}`,
      type,
      x: 0.1,
      y: 0.1,
      width: type === 'photo' ? 0.3 : 0.2,
      height: type === 'photo' ? 0.4 : 0.1,
      rotation: 0,
      data,
      style: {
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#000000',
        shadow: false,
        opacity: 1
      }
    };

    const updatedPages = [...selectedBook.pages];
    updatedPages[currentPage].elements.push(newElement);

    setSelectedBook({
      ...selectedBook,
      pages: updatedPages
    });
  };

  const handleElementUpdate = (elementId: string, updates: Partial<PageElement>) => {
    if (!selectedBook) return;

    const updatedPages = [...selectedBook.pages];
    const elementIndex = updatedPages[currentPage].elements.findIndex(e => e.id === elementId);
    
    if (elementIndex >= 0) {
      updatedPages[currentPage].elements[elementIndex] = {
        ...updatedPages[currentPage].elements[elementIndex],
        ...updates
      };

      setSelectedBook({
        ...selectedBook,
        pages: updatedPages
      });
    }
  };

  const handleDeleteElement = (elementId: string) => {
    if (!selectedBook) return;

    const updatedPages = [...selectedBook.pages];
    updatedPages[currentPage].elements = updatedPages[currentPage].elements.filter(e => e.id !== elementId);

    setSelectedBook({
      ...selectedBook,
      pages: updatedPages
    });
  };

  const generatePreview = () => {
    if (!canvasRef.current || !selectedBook) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on book format
    const baseWidth = bookFormat === 'square' ? 400 : bookFormat === 'landscape' ? 600 : 400;
    const baseHeight = bookFormat === 'square' ? 400 : bookFormat === 'landscape' ? 400 : 600;
    
    canvas.width = baseWidth;
    canvas.height = baseHeight;

    // Clear canvas
    ctx.fillStyle = selectedTheme.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw current page elements
    const currentPageData = selectedBook.pages[currentPage];
    if (currentPageData) {
      currentPageData.elements.forEach(element => {
        const x = element.x * canvas.width;
        const y = element.y * canvas.height;
        const width = element.width * canvas.width;
        const height = element.height * canvas.height;

        ctx.save();
        ctx.translate(x + width/2, y + height/2);
        ctx.rotate(element.rotation * Math.PI / 180);
        ctx.globalAlpha = element.style.opacity;

        if (element.type === 'photo') {
          // Draw photo placeholder
          ctx.fillStyle = '#e5e7eb';
          ctx.fillRect(-width/2, -height/2, width, height);
          
          // Draw photo icon
          ctx.fillStyle = selectedTheme.colors.text;
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('📷', 0, 5);
        } else if (element.type === 'text') {
          // Draw text
          ctx.fillStyle = selectedTheme.colors.text;
          ctx.font = `${Math.max(12, height/3)}px ${selectedTheme.fonts.body}`;
          ctx.textAlign = 'center';
          ctx.fillText(element.data.text || 'Texte', 0, 0);
        } else if (element.type === 'shape') {
          // Draw shape
          ctx.fillStyle = element.data.color || selectedTheme.colors.accent;
          if (element.data.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, Math.min(width, height)/2, 0, 2 * Math.PI);
            ctx.fill();
          } else {
            ctx.fillRect(-width/2, -height/2, width, height);
          }
        }

        // Draw border if specified
        if (element.style.borderWidth > 0) {
          ctx.strokeStyle = element.style.borderColor;
          ctx.lineWidth = element.style.borderWidth;
          ctx.strokeRect(-width/2, -height/2, width, height);
        }

        ctx.restore();
      });
    }

    // Draw selection indicator
    if (selectedElement) {
      const x = selectedElement.x * canvas.width;
      const y = selectedElement.y * canvas.height;
      const width = selectedElement.width * canvas.width;
      const height = selectedElement.height * canvas.height;

      ctx.strokeStyle = selectedTheme.colors.primary;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }
  };

  useEffect(() => {
    generatePreview();
  }, [selectedBook, currentPage, selectedElement, selectedTheme, bookFormat]);

  const currentPageData = selectedBook?.pages[currentPage];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            Création de livres photo
          </h2>
          <p className="text-gray-600">
            Transformez vos souvenirs en magnifiques livres photo personnalisés
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-1" />
            Paramètres
          </Button>
          {selectedBook && (
            <Button onClick={handleSaveBook} disabled={saveBookMutation.isPending}>
              <Save className="w-4 h-4 mr-1" />
              Sauvegarder
            </Button>
          )}
        </div>
      </div>

      {/* Creation Form */}
      {!selectedBook && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Créer un nouveau livre photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Book Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="book-title">Titre du livre</Label>
                <Input
                  id="book-title"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder={tripData?.title || "Mon voyage"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="book-subtitle">Sous-titre (optionnel)</Label>
                <Input
                  id="book-subtitle"
                  value={bookSubtitle}
                  onChange={(e) => setBookSubtitle(e.target.value)}
                  placeholder="Description de votre voyage"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Format and Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium">Format du livre</Label>
                <div className="flex gap-2 mt-2">
                  {[
                    { key: 'landscape', name: 'Paysage', desc: '30x20 cm' },
                    { key: 'portrait', name: 'Portrait', desc: '20x30 cm' },
                    { key: 'square', name: 'Carré', desc: '25x25 cm' }
                  ].map((format) => (
                    <Button
                      key={format.key}
                      variant={bookFormat === format.key ? "default" : "outline"}
                      onClick={() => setBookFormat(format.key as any)}
                      className="flex flex-col h-auto p-3"
                    >
                      <span className="text-xs font-medium">{format.name}</span>
                      <span className="text-xs text-gray-500">{format.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Taille</Label>
                <div className="flex gap-2 mt-2">
                  {[
                    { key: 'small', name: 'Petit', desc: '20 pages' },
                    { key: 'medium', name: 'Moyen', desc: '40 pages' },
                    { key: 'large', name: 'Grand', desc: '80 pages' }
                  ].map((size) => (
                    <Button
                      key={size.key}
                      variant={bookSize === size.key ? "default" : "outline"}
                      onClick={() => setBookSize(size.key as any)}
                      className="flex flex-col h-auto p-3"
                    >
                      <span className="text-xs font-medium">{size.name}</span>
                      <span className="text-xs text-gray-500">{size.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <Label className="text-sm font-medium">Thème du livre</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                {bookThemes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                      selectedTheme.id === theme.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTheme(theme)}
                  >
                    <div className={`w-full h-16 rounded ${theme.preview} mb-2`}></div>
                    <h4 className="font-medium text-sm">{theme.name}</h4>
                    <p className="text-xs text-gray-600">{theme.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-layout"
                  checked={autoLayout}
                  onCheckedChange={setAutoLayout}
                />
                <Label htmlFor="auto-layout" className="text-sm">Mise en page automatique</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-map"
                  checked={includeMap}
                  onCheckedChange={setIncludeMap}
                />
                <Label htmlFor="include-map" className="text-sm">Inclure carte du voyage</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-story"
                  checked={includeStory}
                  onCheckedChange={setIncludeStory}
                />
                <Label htmlFor="include-story" className="text-sm">Générer récit automatique</Label>
              </div>
            </div>

            {/* Create Button */}
            <Button 
              onClick={handleCreateBook}
              disabled={isCreating || createBookMutation.isPending}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Créer le livre photo
                </>
              )}
            </Button>

            {/* Creation Progress */}
            {isCreating && (
              <div className="space-y-2">
                <Progress value={creationProgress} className="w-full" />
                <p className="text-xs text-center text-gray-600">
                  {creationProgress < 20 && "Analyse des photos..."}
                  {creationProgress >= 20 && creationProgress < 40 && "Sélection des meilleures images..."}
                  {creationProgress >= 40 && creationProgress < 60 && "Génération des mises en page..."}
                  {creationProgress >= 60 && creationProgress < 80 && "Application du thème..."}
                  {creationProgress >= 80 && "Finalisation du livre..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Editor Interface */}
      {selectedBook && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Page Navigator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Pages ({selectedBook.totalPages})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedBook.pages.map((page, index) => (
                  <div
                    key={page.id}
                    className={`p-2 border rounded cursor-pointer transition-colors ${
                      currentPage === index ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentPage(index)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Page {page.pageNumber}</span>
                      <Badge variant="outline" className="text-xs">
                        {page.layout}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {page.elements.length} éléments
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    Éditeur - Page {currentPageData?.pageNumber || 1}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <ZoomOut className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <canvas
                    ref={canvasRef}
                    className="w-full max-w-md mx-auto border bg-white rounded shadow-sm cursor-crosshair"
                    onClick={(e) => {
                      const rect = canvasRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      
                      const x = (e.clientX - rect.left) / rect.width;
                      const y = (e.clientY - rect.top) / rect.height;
                      
                      // Find clicked element
                      const clickedElement = currentPageData?.elements.find(element =>
                        x >= element.x && x <= element.x + element.width &&
                        y >= element.y && y <= element.y + element.height
                      );
                      
                      setSelectedElement(clickedElement || null);
                    }}
                  />
                </div>

                {/* Page Controls */}
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    ← Précédente
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} sur {selectedBook.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === selectedBook.pages.length - 1}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Suivante →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tools Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Outils
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Elements */}
              <div>
                <Label className="text-sm font-medium">Ajouter</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddElement('photo', { url: '/placeholder-photo.jpg' })}
                  >
                    <ImageIcon className="w-3 h-3 mr-1" />
                    Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddElement('text', { text: 'Nouveau texte' })}
                  >
                    <Type className="w-3 h-3 mr-1" />
                    Texte
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddElement('shape', { shape: 'rectangle', color: selectedTheme.colors.accent })}
                  >
                    <Palette className="w-3 h-3 mr-1" />
                    Forme
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddElement('map', { location: tripData?.location })}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    Carte
                  </Button>
                </div>
              </div>

              {/* Element Properties */}
              {selectedElement && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Propriétés de l'élément</Label>
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Largeur</Label>
                        <Input
                          type="number"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={selectedElement.width}
                          onChange={(e) => handleElementUpdate(selectedElement.id, { width: parseFloat(e.target.value) })}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hauteur</Label>
                        <Input
                          type="number"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={selectedElement.height}
                          onChange={(e) => handleElementUpdate(selectedElement.id, { height: parseFloat(e.target.value) })}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Rotation</Label>
                      <Input
                        type="range"
                        min="-180"
                        max="180"
                        value={selectedElement.rotation}
                        onChange={(e) => handleElementUpdate(selectedElement.id, { rotation: parseInt(e.target.value) })}
                        className="text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Opacité</Label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedElement.style.opacity}
                        onChange={(e) => handleElementUpdate(selectedElement.id, { 
                          style: { ...selectedElement.style, opacity: parseFloat(e.target.value) }
                        })}
                        className="text-xs"
                      />
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteElement(selectedElement.id)}
                      className="w-full"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Actions rapides</Label>
                <div className="space-y-2 mt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="w-3 h-3 mr-1" />
                    Exporter PDF
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Share className="w-3 h-3 mr-1" />
                    Partager
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Copy className="w-3 h-3 mr-1" />
                    Dupliquer page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Existing Books */}
      {existingBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Livres photo existants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {existingBooks.map((book: PhotoBook) => (
                <div key={book.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{book.title}</h4>
                    <Badge variant={book.isPublished ? "default" : "secondary"}>
                      {book.isPublished ? "Publié" : "Brouillon"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{book.totalPages} pages</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedBook(book)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Éditer
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      Aperçu
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Search, Filter, ShoppingCart, Download, Eye, Heart, Verified, TrendingUp, DollarSign } from 'lucide-react';

interface MarketplaceItem {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  rating: number;
  totalSales: number;
  thumbnailUrl: string;
  seller: {
    name: string;
    verified: boolean;
    rating: number;
  };
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  const { data: featuredItems, isLoading } = useQuery<MarketplaceItem[]>({
    queryKey: ['/api/marketplace/featured'],
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'guide': return '📖';
      case 'video': return '🎬';
      case 'photo_book': return '📸';
      case 'itinerary': return '🗺️';
      default: return '📦';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'guide': return 'Guides de Voyage';
      case 'video': return 'Vidéos';
      case 'photo_book': return 'Livres Photo';
      case 'itinerary': return 'Itinéraires';
      default: return 'Autre';
    }
  };

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'guide', label: 'Guides de Voyage' },
    { value: 'video', label: 'Vidéos' },
    { value: 'photo_book', label: 'Livres Photo' },
    { value: 'itinerary', label: 'Itinéraires' },
  ];

  const sortOptions = [
    { value: 'featured', label: 'En vedette' },
    { value: 'newest', label: 'Plus récent' },
    { value: 'price_low', label: 'Prix croissant' },
    { value: 'price_high', label: 'Prix décroissant' },
    { value: 'rating', label: 'Mieux notés' },
    { value: 'popular', label: 'Plus populaires' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Marketplace Wanderlust
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez et achetez du contenu créé par notre communauté de voyageurs.
            Guides, vidéos, livres photo et bien plus encore.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher des guides, vidéos, livres photo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-64">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 mx-auto mb-8">
            <TabsTrigger value="browse">Parcourir</TabsTrigger>
            <TabsTrigger value="sell">Vendre</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-8">
            {/* Featured Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Articles en Vedette</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredItems?.map((item) => (
                  <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="relative">
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-4xl">{getCategoryIcon(item.category)}</span>
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Button size="sm" variant="outline" className="bg-white/90 backdrop-blur-sm border-0">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {item.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Rating and Sales */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{item.rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Download className="w-4 h-4" />
                          <span>{item.totalSales} ventes</span>
                        </div>
                      </div>

                      {/* Seller */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {item.seller.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{item.seller.name}</span>
                            {item.seller.verified && (
                              <Verified className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{item.seller.rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xl font-bold text-gray-900">
                          {item.price}€
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Aperçu
                          </Button>
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Acheter
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Parcourir par Catégorie</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.slice(1).map((category) => (
                  <Card key={category.value} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">{getCategoryIcon(category.value)}</div>
                      <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {category.label}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {category.value === 'guide' ? '156 articles' :
                         category.value === 'video' ? '89 articles' :
                         category.value === 'photo_book' ? '67 articles' :
                         '34 articles'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sell" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Vendez vos Créations</CardTitle>
                  <CardDescription>
                    Partagez votre expertise et gagnez de l'argent en vendant vos guides, vidéos et livres photo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Benefits */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-medium mb-2">Commission attractive</h3>
                      <p className="text-sm text-gray-600">
                        Gardez 85% de vos ventes. Nous ne prenons que 15% de commission.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="font-medium mb-2">Audience engagée</h3>
                      <p className="text-sm text-gray-600">
                        Accédez à notre communauté de voyageurs passionnés.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Verified className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="font-medium mb-2">Support dédié</h3>
                      <p className="text-sm text-gray-600">
                        Notre équipe vous accompagne pour optimiser vos ventes.
                      </p>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-lg font-medium mb-4 text-center">Comment ça marche</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                          1
                        </div>
                        <h4 className="font-medium mb-1">Créez</h4>
                        <p className="text-sm text-gray-600">
                          Préparez vos guides, vidéos ou livres photo
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                          2
                        </div>
                        <h4 className="font-medium mb-1">Publiez</h4>
                        <p className="text-sm text-gray-600">
                          Ajoutez vos créations sur la marketplace
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                          3
                        </div>
                        <h4 className="font-medium mb-1">Vendez</h4>
                        <p className="text-sm text-gray-600">
                          Notre communauté découvre et achète vos produits
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                          4
                        </div>
                        <h4 className="font-medium mb-1">Gagnez</h4>
                        <p className="text-sm text-gray-600">
                          Recevez vos paiements chaque semaine
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                      Commencer à Vendre
                    </Button>
                    <p className="text-sm text-gray-600 mt-3">
                      Inscription gratuite • Aucun frais initial
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Marketplace</CardTitle>
                  <CardDescription>
                    Suivez les performances de vos ventes et découvrez les tendances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="mb-4">Commencez à vendre pour accéder à vos analytics</p>
                    <Button variant="outline">
                      Publier votre premier article
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
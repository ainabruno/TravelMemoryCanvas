import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ShoppingBag, Search, Filter, Heart, Download, Eye, Verified, TrendingUp } from 'lucide-react';

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
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState('all');

  const { data: items = [], isLoading } = useQuery<MarketplaceItem[]>({
    queryKey: ['/api/marketplace/items', { category: selectedCategory, search: searchQuery, sort: sortBy }],
  });

  const categories = [
    { value: 'all', label: 'Tout' },
    { value: 'guides', label: 'Guides' },
    { value: 'videos', label: 'Vidéos' },
    { value: 'photo-books', label: 'Livres Photo' },
    { value: 'presets', label: 'Préréglages' },
    { value: 'templates', label: 'Modèles' }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Populaire' },
    { value: 'newest', label: 'Plus récent' },
    { value: 'rating', label: 'Mieux noté' },
    { value: 'price-low', label: 'Prix croissant' },
    { value: 'price-high', label: 'Prix décroissant' }
  ];

  const priceRanges = [
    { value: 'all', label: 'Tous les prix' },
    { value: '0-10', label: '0€ - 10€' },
    { value: '10-25', label: '10€ - 25€' },
    { value: '25-50', label: '25€ - 50€' },
    { value: '50+', label: '50€+' }
  ];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    let matchesPrice = true;
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(p => p === '+' ? Infinity : parseInt(p));
      matchesPrice = item.price >= min && (max === undefined || item.price <= max);
    }
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <ShoppingBag className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Marketplace</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez et vendez des guides de voyage, vidéos et livres photo créés par la communauté Wanderlust
          </p>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 mx-auto mb-8">
            <TabsTrigger value="browse">Parcourir</TabsTrigger>
            <TabsTrigger value="my-purchases">Mes Achats</TabsTrigger>
            <TabsTrigger value="sell">Vendre</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Filtres et recherche */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher des produits..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
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
                    <SelectTrigger>
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

                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Prix" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Grille de produits */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <img
                      src={item.thumbnailUrl || "/api/placeholder/300/200"}
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button size="sm" variant="ghost" className="bg-white/80 hover:bg-white">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="bg-white/80 hover:bg-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    <Badge 
                      className="absolute top-2 left-2" 
                      variant={item.category === 'guides' ? 'default' : 'secondary'}
                    >
                      {categories.find(c => c.value === item.category)?.label}
                    </Badge>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                      <div className="text-right">
                        <div className="text-xl font-bold text-emerald-600">
                          {item.price}€
                        </div>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {item.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{item.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({item.totalSales} ventes)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {item.seller.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{item.seller.name}</span>
                        {item.seller.verified && (
                          <Verified className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        Ajouter au panier
                      </Button>
                      <Button variant="outline" className="px-3">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-600">
                  Essayez de modifier vos filtres de recherche
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-purchases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mes Achats</CardTitle>
                <CardDescription>
                  Gérez vos achats et téléchargements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Aucun achat pour le moment
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Commencez à explorer le marketplace pour trouver du contenu incroyable
                  </p>
                  <Button>Parcourir le marketplace</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sell" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendez vos créations</CardTitle>
                <CardDescription>
                  Partagez vos guides, vidéos et livres photo avec la communauté
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="text-center p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Guides de voyage</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Partagez vos conseils et itinéraires
                    </p>
                    <Button variant="outline" size="sm">Créer un guide</Button>
                  </Card>

                  <Card className="text-center p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Vidéos de voyage</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Vendez vos montages vidéo
                    </p>
                    <Button variant="outline" size="sm">Télécharger vidéo</Button>
                  </Card>

                  <Card className="text-center p-6">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Livres photo</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Créez des livres photo premium
                    </p>
                    <Button variant="outline" size="sm">Créer livre</Button>
                  </Card>
                </div>

                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Rejoignez nos vendeurs</h3>
                      <p className="text-emerald-100 mb-4">
                        Gagnez jusqu'à 70% de commission sur vos ventes
                      </p>
                      <Button variant="secondary" className="bg-white text-emerald-600 hover:bg-gray-100">
                        Devenir vendeur
                      </Button>
                    </div>
                    <TrendingUp className="w-16 h-16 text-emerald-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
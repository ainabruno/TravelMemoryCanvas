import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  Plane, 
  MapPin, 
  Camera, 
  Calendar,
  Clock,
  Globe,
  Mountain,
  Star,
  TrendingUp,
  Award,
  Target,
  Compass,
  Users,
  Heart,
  DollarSign,
  Activity,
  Map,
  Eye,
  Share2,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Trophy
} from "lucide-react";

interface TravelStats {
  totalTrips: number;
  totalPhotos: number;
  totalCountries: number;
  totalCities: number;
  totalDistance: number;
  totalDuration: number;
  favoriteDestination: string;
  mostActiveMonth: string;
  averageTripDuration: number;
  photosByMonth: Array<{ month: string; photos: number; trips: number }>;
  countriesVisited: Array<{ country: string; visits: number; photos: number; lastVisit: string }>;
  tripsByType: Array<{ type: string; count: number; percentage: number }>;
  budgetAnalysis: Array<{ category: string; amount: number; trips: number }>;
  travelFrequency: Array<{ year: string; trips: number; distance: number }>;
  seasonalTrends: Array<{ season: string; popularity: number; avgRating: number }>;
  achievements: Array<{ 
    id: string; 
    title: string; 
    description: string; 
    icon: string; 
    unlocked: boolean; 
    progress: number;
    target: number;
  }>;
  personalBests: {
    longestTrip: { duration: number; destination: string };
    mostPhotosInTrip: { count: number; destination: string };
    farthestDestination: { distance: number; destination: string };
    quickestTrip: { duration: number; destination: string };
  };
  travelStyle: {
    adventureLevel: number;
    culturalFocus: number;
    natureLover: number;
    cityExplorer: number;
    photographer: number;
    socialTraveler: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function TravelStatistics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'year' | 'month'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  // Fetch travel statistics
  const { data: stats, isLoading } = useQuery<TravelStats>({
    queryKey: ["/api/stats/travel", selectedPeriod, selectedYear],
  });

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
  };

  const formatDistance = (km: number) => {
    if (km < 1000) return `${km} km`;
    return `${(km / 1000).toFixed(1)}k km`;
  };

  const getAchievementIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'globe': <Globe className="w-6 h-6" />,
      'camera': <Camera className="w-6 h-6" />,
      'mountain': <Mountain className="w-6 h-6" />,
      'star': <Star className="w-6 h-6" />,
      'award': <Award className="w-6 h-6" />,
      'target': <Target className="w-6 h-6" />,
      'compass': <Compass className="w-6 h-6" />,
      'users': <Users className="w-6 h-6" />
    };
    return icons[iconName] || <Star className="w-6 h-6" />;
  };

  const getTravelStyleColor = (value: number) => {
    if (value >= 80) return 'text-green-600 bg-green-100';
    if (value >= 60) return 'text-blue-600 bg-blue-100';
    if (value >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune statistique disponible</h3>
        <p className="text-gray-600">
          Commencez à créer des voyages pour voir vos statistiques de voyage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Statistiques de Voyage
            </h1>
            <p className="text-gray-600 mt-1">
              Découvrez vos habitudes de voyage et vos accomplissements
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={(value: 'all' | 'year' | 'month') => setSelectedPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute période</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
            {selectedPeriod === 'year' && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="destinations" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Destinations
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tendances
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Accomplissements
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Profil Voyageur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Voyages totaux</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalTrips}</p>
                  </div>
                  <Plane className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary" className="text-xs">
                    +2 ce mois-ci
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Photos prises</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPhotos.toLocaleString()}</p>
                  </div>
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(stats.totalPhotos / stats.totalTrips)} par voyage
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pays visités</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalCountries}</p>
                  </div>
                  <Globe className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary" className="text-xs">
                    {stats.totalCities} villes
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Distance parcourue</p>
                    <p className="text-3xl font-bold text-gray-900">{formatDistance(stats.totalDistance)}</p>
                  </div>
                  <Map className="w-8 h-8 text-red-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary" className="text-xs">
                    {formatDuration(stats.totalDuration)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Photos by Month */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Activité mensuelle
                  </CardTitle>
                  <Select value={chartType} onValueChange={(value: 'bar' | 'line' | 'pie') => setChartType(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Barres</SelectItem>
                      <SelectItem value="line">Ligne</SelectItem>
                      <SelectItem value="pie">Secteurs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'bar' && (
                    <BarChart data={stats.photosByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="photos" fill="#3B82F6" name="Photos" />
                      <Bar dataKey="trips" fill="#10B981" name="Voyages" />
                    </BarChart>
                  )}
                  {chartType === 'line' && (
                    <LineChart data={stats.photosByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="photos" stroke="#3B82F6" name="Photos" strokeWidth={2} />
                      <Line type="monotone" dataKey="trips" stroke="#10B981" name="Voyages" strokeWidth={2} />
                    </LineChart>
                  )}
                  {chartType === 'area' && (
                    <AreaChart data={stats.photosByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="photos" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Photos" />
                      <Area type="monotone" dataKey="trips" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Voyages" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trip Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Types de voyage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.tripsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }) => `${type} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.tripsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Personal Bests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Records personnels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Voyage le plus long</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">
                    {formatDuration(stats.personalBests.longestTrip.duration)}
                  </p>
                  <p className="text-xs text-blue-700">{stats.personalBests.longestTrip.destination}</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Plus de photos</span>
                  </div>
                  <p className="text-lg font-bold text-green-900">
                    {stats.personalBests.mostPhotosInTrip.count} photos
                  </p>
                  <p className="text-xs text-green-700">{stats.personalBests.mostPhotosInTrip.destination}</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Destination la plus lointaine</span>
                  </div>
                  <p className="text-lg font-bold text-purple-900">
                    {formatDistance(stats.personalBests.farthestDestination.distance)}
                  </p>
                  <p className="text-xs text-purple-700">{stats.personalBests.farthestDestination.destination}</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Voyage le plus rapide</span>
                  </div>
                  <p className="text-lg font-bold text-orange-900">
                    {formatDuration(stats.personalBests.quickestTrip.duration)}
                  </p>
                  <p className="text-xs text-orange-700">{stats.personalBests.quickestTrip.destination}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="destinations" className="space-y-6">
          {/* Favorite Destinations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Destinations favorites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.countriesVisited.slice(0, 10).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{country.country}</h4>
                        <p className="text-sm text-gray-600">
                          Dernière visite: {new Date(country.lastVisit).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4 mb-1">
                        <Badge variant="outline">{country.visits} visite(s)</Badge>
                        <Badge variant="secondary">{country.photos} photos</Badge>
                      </div>
                      <Progress 
                        value={(country.visits / Math.max(...stats.countriesVisited.map(c => c.visits))) * 100} 
                        className="w-32 h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* World Map Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Carte du monde des voyages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Carte interactive des voyages</h3>
                  <p className="text-gray-600">
                    Visualisez tous vos voyages sur une carte du monde interactive
                  </p>
                  <Button className="mt-4">
                    Voir la carte complète
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Travel Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Évolution des voyages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.travelFrequency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="trips" 
                    stackId="1" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6} 
                    name="Nombre de voyages" 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="distance" 
                    stroke="#EF4444" 
                    strokeWidth={2} 
                    name="Distance (km)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Seasonal Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Tendances saisonnières
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={stats.seasonalTrends}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="season" />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} />
                    <Radar
                      name="Popularité"
                      dataKey="popularity"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Note moyenne"
                      dataKey="avgRating"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Budget Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Analyse budgétaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.budgetAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value}€`, 'Montant']} />
                    <Bar dataKey="amount" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.achievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`transition-all ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${
                      achievement.unlocked 
                        ? 'bg-yellow-100 text-yellow-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getAchievementIcon(achievement.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${
                          achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {achievement.title}
                        </h3>
                        {achievement.unlocked && (
                          <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                            Débloqué
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm mb-3 ${
                        achievement.unlocked ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {achievement.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progression</span>
                          <span>{achievement.progress}/{achievement.target}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.target) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          {/* Travel Style Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="w-5 h-5" />
                Votre style de voyage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(stats.travelStyle).map(([key, value]) => {
                  const labels: { [key: string]: string } = {
                    adventureLevel: 'Aventurier',
                    culturalFocus: 'Culturel',
                    natureLover: 'Amoureux de la nature',
                    cityExplorer: 'Explorateur urbain',
                    photographer: 'Photographe',
                    socialTraveler: 'Voyageur social'
                  };

                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{labels[key]}</span>
                        <Badge variant="outline" className={getTravelStyleColor(value)}>
                          {value}%
                        </Badge>
                      </div>
                      <Progress value={value} className="h-3" />
                      <p className="text-xs text-gray-600">
                        {value >= 80 && "Expert dans ce domaine"}
                        {value >= 60 && value < 80 && "Très expérimenté"}
                        {value >= 40 && value < 60 && "Moyennement expérimenté"}
                        {value < 40 && "Débutant"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Travel Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Recommandations personnalisées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mountain className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Défi Aventure</h4>
                      <p className="text-sm text-blue-800">
                        Vous aimez l'aventure ! Essayez la randonnée en haute montagne ou l'exploration de grottes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">Photographe Expert</h4>
                      <p className="text-sm text-green-800">
                        Vos compétences en photographie sont excellentes ! Organisez un voyage photo au Japon.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-purple-900 mb-1">Nouveau Continent</h4>
                      <p className="text-sm text-purple-800">
                        Il est temps de découvrir l'Amérique du Sud ! L'Argentine ou le Pérou seraient parfaits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
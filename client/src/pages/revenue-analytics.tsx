import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Euro, TrendingUp, Users, ShoppingCart, Percent, Calendar, Target, Award } from 'lucide-react';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  subscriptions: {
    active: number;
    growth: number;
    churn: number;
  };
  marketplace: {
    totalSales: number;
    commission: number;
    topCategories: Array<{
      name: string;
      revenue: number;
      sales: number;
    }>;
  };
  affiliate: {
    totalCommissions: number;
    activeAffiliates: number;
    conversionRate: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    subscriptions: number;
    marketplace: number;
  }>;
}

export default function RevenueAnalytics() {
  const { data: revenueData, isLoading } = useQuery<RevenueData>({
    queryKey: ['/api/revenue/analytics'],
  });

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Impossible de charger les données de revenus</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Analytics de Revenus
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Suivez les performances financières de Wanderlust et analysez 
            les sources de revenus en temps réel.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenus Totaux</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {revenueData.totalRevenue.toLocaleString()}€
                  </p>
                  <p className="text-sm text-green-600 mt-1">+12.5% ce mois</p>
                </div>
                <div className="p-3 bg-green-100 rounded-2xl">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Abonnements Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {revenueData.subscriptions.active.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    +{revenueData.subscriptions.growth}% croissance
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-2xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ventes Marketplace</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {revenueData.marketplace.totalSales}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {revenueData.marketplace.commission.toFixed(2)}€ commission
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-2xl">
                  <ShoppingCart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux de Conversion</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {revenueData.affiliate.conversionRate}%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {revenueData.affiliate.activeAffiliates} affiliés
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-2xl">
                  <Percent className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px] mx-auto mb-8">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="affiliate">Affiliation</TabsTrigger>
            <TabsTrigger value="forecasts">Prévisions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Revenus</CardTitle>
                <CardDescription>
                  Tendance des revenus mensuels par source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        name="Revenus Totaux"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="subscriptions" 
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        name="Abonnements"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="marketplace" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Marketplace"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Sources */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sources de Revenus</CardTitle>
                  <CardDescription>
                    Répartition par type de revenus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Abonnements', value: 65, color: '#6366f1' },
                            { name: 'Marketplace', value: 25, color: '#06b6d4' },
                            { name: 'Affiliation', value: 10, color: '#10b981' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {[
                            { name: 'Abonnements', value: 65, color: '#6366f1' },
                            { name: 'Marketplace', value: 25, color: '#06b6d4' },
                            { name: 'Affiliation', value: 10, color: '#10b981' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>KPIs Clés</CardTitle>
                  <CardDescription>
                    Indicateurs de performance actuels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ARPU (Revenue par Utilisateur)</span>
                    <span className="font-medium">12.34€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Taux de Churn</span>
                    <Badge variant="outline" className="text-red-600">
                      {revenueData.subscriptions.churn}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">LTV Moyenne</span>
                    <span className="font-medium">98.50€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">CAC (Coût d'Acquisition)</span>
                    <span className="font-medium">15.20€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ratio LTV/CAC</span>
                    <Badge className="bg-green-100 text-green-800">
                      6.5x
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance des Plans</CardTitle>
                  <CardDescription>
                    Revenus par type d'abonnement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { plan: 'Gratuit', users: 850, revenue: 0 },
                        { plan: 'Explorateur', users: 320, revenue: 3200 },
                        { plan: 'Professionnel', users: 75, revenue: 1500 },
                        { plan: 'Entreprise', users: 5, revenue: 250 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="plan" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#6366f1" name="Revenus (€)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métriques d'Abonnement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nouvelles inscriptions (ce mois)</span>
                      <span className="font-medium text-green-600">+156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Upgrades</span>
                      <span className="font-medium text-blue-600">+43</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Downgrades</span>
                      <span className="font-medium text-orange-600">-12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annulations</span>
                      <span className="font-medium text-red-600">-27</span>
                    </div>
                    <div className="border-t pt-3 mt-4">
                      <div className="flex justify-between font-medium">
                        <span>Croissance nette</span>
                        <span className="text-green-600">+160</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Catégories Marketplace</CardTitle>
                <CardDescription>
                  Performance des ventes par catégorie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData.marketplace.topCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-gray-600">{category.sales} ventes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {category.revenue.toFixed(2)}€
                        </p>
                        <p className="text-sm text-gray-600">
                          {((category.revenue / revenueData.marketplace.commission) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="affiliate" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Affiliation</CardTitle>
                  <CardDescription>
                    Statistiques du programme d'affiliation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total commissions versées</span>
                    <span className="font-medium">{revenueData.affiliate.totalCommissions.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Affiliés actifs</span>
                    <span className="font-medium">{revenueData.affiliate.activeAffiliates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taux de conversion moyen</span>
                    <span className="font-medium">{revenueData.affiliate.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission moyenne</span>
                    <span className="font-medium">26.30€</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Affiliés</CardTitle>
                  <CardDescription>
                    Meilleurs performeurs ce mois
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Marie D.', sales: 12, commission: 240 },
                      { name: 'Alex T.', sales: 8, commission: 160 },
                      { name: 'Sophie M.', sales: 6, commission: 120 }
                    ].map((affiliate, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {affiliate.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{affiliate.name}</p>
                            <p className="text-sm text-gray-600">{affiliate.sales} conversions</p>
                          </div>
                        </div>
                        <span className="font-medium text-green-600">
                          {affiliate.commission}€
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forecasts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prévisions de Revenus</CardTitle>
                <CardDescription>
                  Projections basées sur les tendances actuelles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-medium">Fin de mois</p>
                    <p className="text-2xl font-bold text-blue-600">18,200€</p>
                    <p className="text-sm text-gray-600">+15% vs objectif</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">Trimestre</p>
                    <p className="text-2xl font-bold text-green-600">52,800€</p>
                    <p className="text-sm text-gray-600">+8% vs objectif</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Award className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="font-medium">Année</p>
                    <p className="text-2xl font-bold text-purple-600">195,000€</p>
                    <p className="text-sm text-gray-600">+12% vs objectif</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Recommandations</h3>
                  <ul className="space-y-1 text-blue-800 text-sm">
                    <li>• Augmenter les efforts marketing pour le plan Professionnel</li>
                    <li>• Développer de nouveaux contenus premium pour la marketplace</li>
                    <li>• Optimiser le taux de conversion des affiliés</li>
                    <li>• Lancer une campagne de réactivation pour réduire le churn</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}